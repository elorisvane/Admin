import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/app/src/components/Sidebar";

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
        <Sidebar />
        <main className="ml-64 min-h-screen px-10 py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </body>
    </html>
  );
}
