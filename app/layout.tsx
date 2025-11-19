import "./globals.css";
import { Inter } from "next/font/google";
import clsx from "clsx";
import type { Metadata } from "next";
import { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "PantryVision Chef",
  description:
    "Upload a photo of your leftover ingredients to get AI-generated recipes and share them instantly over WhatsApp."
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body className={clsx(inter.variable, "font-sans antialiased bg-transparent")}>{children}</body>
  </html>
);

export default RootLayout;
