"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { UploadBox } from "@/components/UploadBox";
import { RecipeCard } from "@/components/RecipeCard";
import type { AgentResponse } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agentic-4c933fc2.vercel.app";

const HomePage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResponse | null>(null);

  const handleFileAccepted = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return nextUrl;
    });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const message = await response.json().catch(() => ({}));
        throw new Error(message?.error ?? "Unable to generate recipes right now.");
      }

      const data = (await response.json()) as AgentResponse;
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const whatsappShareHref = useMemo(() => {
    if (!result) return null;

    const header = "*PantryVision Chef* looked at my leftovers and dreamt up:";
    const recipes = result.recipes
      .slice(0, 3)
      .map((recipe, index) => `${index + 1}) ${recipe.title} — ${recipe.description}`)
      .join("%0A%0A");
    const url = encodeURIComponent(APP_URL);
    const items = encodeURIComponent(`Detected: ${result.identifiedItems.slice(0, 6).join(", ")}`);
    const body = encodeURIComponent(header) + "%0A%0A" + items + "%0A%0A" + recipes + "%0A%0A" + url;

    return `https://api.whatsapp.com/send?text=${body}`;
  }, [result]);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }, [previewUrl]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-16 sm:px-8 lg:px-10">
      <section className="flex flex-col gap-8 rounded-3xl bg-white/80 p-10 shadow-xl shadow-slate-900/5 backdrop-blur">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-brand">
              PantryVision Chef
            </span>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
              Turn fridge scraps into chef-ready WhatsApp recipes.
            </h1>
            <p className="text-lg text-slate-600">
              Snap a photo of what&apos;s left in your kitchen and let our vision model assemble at least three waste-saving
              dishes. Share them instantly with family or your sous-chef over WhatsApp.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">Vision AI analysis</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Tailored recipe ideation</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Twilio WhatsApp ready</span>
            </div>
          </div>
          <div className="relative h-48 w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-inner">
            <Image
              src="https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80"
              alt="Leftover veggies on a cutting board"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        <UploadBox onFileAccepted={handleFileAccepted} disabled={isLoading} hasFile={Boolean(selectedFile)} />
        <div className="flex flex-wrap gap-4">
          <button
            disabled={!selectedFile || isLoading}
            onClick={handleAnalyze}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/40 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" className="stroke-white/30" strokeWidth="4" fill="none" />
                  <path d="M22 12a10 10 0 0 0-10-10" className="stroke-white" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                Analyzing pantry...
              </>
            ) : (
              <>
                <span>Generate recipes</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 7H7v6h6V7z" opacity="0.3" />
                  <path d="M5 3a2 2 0 00-2 2v10c0 1.1.9 2 2 2h10a2 2 0 002-2V5c0-1.1-.9-2-2-2H5zm10 12H5V5h10v10z" />
                </svg>
              </>
            )}
          </button>
          {selectedFile ? (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
              disabled={isLoading}
            >
              Reset
            </button>
          ) : null}
          {result && whatsappShareHref ? (
            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-green-500 bg-green-500/10 px-5 py-3 text-sm font-semibold text-green-600 transition hover:bg-green-500/20"
            >
              Share on WhatsApp
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.54 2 2.08 6.45 2.05 11.95c-.01 2.12.65 4.15 1.88 5.89L2 22l4.28-1.87a9.94 9.94 0 0 0 5.76 1.76h.01c5.5 0 9.96-4.45 9.99-9.95A9.96 9.96 0 0 0 12.04 2Zm5.84 14.32c-.25.7-1.47 1.37-2.04 1.46-.52.08-1.19.11-1.92-.12-.44-.14-.99-.32-1.7-.63-2.99-1.3-4.94-4.33-5.08-4.54-.15-.21-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.05-2.48.27-.29.6-.36.8-.36.21 0 .4.01.57.02.18.01.43-.07.68.52.25.6.85 2.05.93 2.2.07.15.12.33.02.54-.1.21-.15.33-.3.5-.15.17-.32.39-.45.53-.15.15-.3.31-.13.61.17.29.76 1.25 1.62 2.03 1.12.99 2.05 1.3 2.34 1.45.29.15.46.13.62-.08.16-.21.72-.84.91-1.13.19-.29.39-.24.66-.14.27.1 1.73.82 2.02.97.3.15.5.22.57.34.07.12.07.69-.18 1.39Z" />
              </svg>
            </a>
          ) : null}
        </div>
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p> : null}
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">Recipe flight</h2>
          {result ? (
            <div className="grid gap-5 md:grid-cols-2">
              {result.recipes.map((recipe, index) => (
                <RecipeCard key={recipe.title} recipe={recipe} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/70 p-10 text-center text-slate-500">
              Upload a photo to see three personalized dishes crafted from your leftovers.
            </div>
          )}
        </div>
        <aside className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/70 p-8 backdrop-blur">
          <h3 className="text-xl font-semibold text-slate-900">WhatsApp automation</h3>
          <p className="text-sm text-slate-600">
            Hook PantryVision Chef into your WhatsApp hotline with a Twilio webhook. Every food photo sent to your number
            returns a ready-to-cook recipe trio.
          </p>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                1
              </span>
              <span>
                Point your Twilio WhatsApp sandbox or business number webhook to <code>{APP_URL}/api/whatsapp</code>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                2
              </span>
              <span>
                Set environment variables <code>OPENAI_API_KEY</code>, <code>TWILIO_ACCOUNT_SID</code>, and{" "}
                <code>TWILIO_AUTH_TOKEN</code> on Vercel for vision analysis and media fetch.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
                3
              </span>
              <span>
                Encourage users to send a clear photo of their leftovers; our agent replies with ingredients, notes, and three
                dishes they can cook tonight.
              </span>
            </li>
          </ol>
          {previewUrl ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-inner">
              <p className="mb-3 text-sm font-semibold text-slate-700">Uploaded snapshot</p>
              <div className="relative h-56 w-full overflow-hidden rounded-2xl">
                <Image src={previewUrl} alt="Uploaded pantry snapshot" fill className="object-cover" unoptimized />
              </div>
            </div>
          ) : null}
          {result ? (
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm text-slate-700">
              <p className="mb-2 font-semibold text-brand">Detected ingredients</p>
              <ul className="list-inside list-disc space-y-1">
                {result.identifiedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {result.confidenceNotes.length > 0 ? (
                <div className="mt-3 rounded-xl bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence notes</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    {result.confidenceNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
};

export default HomePage;
