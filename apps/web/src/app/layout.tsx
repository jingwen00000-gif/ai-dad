import type { Metadata, Viewport } from "next";
import { StoreHydrator } from "@/components/store-hydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Dad",
  description: "Always here. Even when Dad is away.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4A63E7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
