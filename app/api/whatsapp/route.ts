"use server";

import { buildFallbackResponse, runVisionAgent } from "@/lib/agent";
import type { AgentResponse } from "@/lib/types";
import { NextResponse } from "next/server";
import { validateRequest } from "twilio/lib/webhooks/webhooks";

const APP_URL = process.env.APP_BASE_URL ?? "https://agentic-4c933fc2.vercel.app";

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildWhatsappMessage(result: AgentResponse): string {
  const ingredientsLine = result.identifiedItems.slice(0, 6).join(", ");
  const recipesLines = result.recipes
    .slice(0, 3)
    .map((recipe, index) => {
      const topIngredients = recipe.ingredients.slice(0, 3).join(", ");
      return `${index + 1}) ${recipe.title} — ${recipe.description}\n   Core: ${topIngredients}`;
    })
    .join("\n\n");

  const notes =
    result.confidenceNotes.length > 0 ? `\n\nNotes: ${result.confidenceNotes.slice(0, 2).join(" • ")}` : "";

  return `*PantryVision Chef*\nDetected: ${ingredientsLine}\n\n${recipesLines}${notes}\n\nSee full prep steps online → ${APP_URL}`;
}

function buildTwimlResponse(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

async function fetchMediaAsBase64(url: string, accountSid?: string, authToken?: string): Promise<string | null> {
  try {
    const headers =
      accountSid && authToken
        ? {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`
          }
        : undefined;

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    console.error("Failed to download media from Twilio:", error);
    return null;
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = typeof value === "string" ? value : value.toString();
  });

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;

  if (authToken) {
    const signature = request.headers.get("x-twilio-signature") ?? "";
    const isValid = validateRequest(authToken, signature, request.url, params);
    if (!isValid) {
      return new NextResponse("Invalid Twilio signature", { status: 403 });
    }
  }

  const from = params.From ?? "";
  const numMedia = parseInt(params.NumMedia ?? "0", 10);

  if (!from) {
    return new NextResponse("Missing sender information.", { status: 400 });
  }

  if (numMedia < 1) {
    const message =
      "PantryVision Chef here! Please send a photo of your leftovers so I can whip up three tailored recipes for you.";
    return new NextResponse(buildTwimlResponse(message), {
      status: 200,
      headers: { "Content-Type": "text/xml" }
    });
  }

  const mediaUrl = params.MediaUrl0;
  if (!mediaUrl) {
    const message = "I couldn't find the attached photo. Please try again with a clear image of your ingredients.";
    return new NextResponse(buildTwimlResponse(message), {
      status: 200,
      headers: { "Content-Type": "text/xml" }
    });
  }

  const base64 = await fetchMediaAsBase64(mediaUrl, accountSid, authToken);
  let agentResult: AgentResponse;

  try {
    if (!base64) {
      agentResult = buildFallbackResponse();
    } else {
      agentResult = await runVisionAgent(base64);
    }
  } catch (error) {
    console.error("WhatsApp agent failure:", error);
    const message = "I hit a snag while analyzing that photo. Please try again in a moment.";
    return new NextResponse(buildTwimlResponse(message), {
      status: 200,
      headers: { "Content-Type": "text/xml" }
    });
  }

  const reply = buildWhatsappMessage(agentResult);

  return new NextResponse(buildTwimlResponse(reply), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
