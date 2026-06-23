import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/app/src/components/AppShell";

export const metadata: Metadata = {
  title: "ÉLORIS · Atelier Admin",
  description: "Manage the ÉLORIS storefront — products and journal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
