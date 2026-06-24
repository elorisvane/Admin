import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/app/src/components/AppShell";
import { getCategories } from "@/app/src/data/products";

export const metadata: Metadata = {
  title: "ÉLORIS · Atelier Admin",
  description: "Manage the ÉLORIS storefront — products and journal.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Feed the sidebar's per-category Products sub-nav. Falls back to an empty
  // list if Supabase is unreachable, so the chrome still renders.
  const categories = await getCategories().catch(() => []);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell categories={categories}>{children}</AppShell>
      </body>
    </html>
  );
}
