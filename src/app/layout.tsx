import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ILH Audits — Property Audit Management",
  description:
    "Ivy League House property audit management system. Digitize, track, and analyze property audits across all ILH student housing locations in India.",
  icons: {
    icon: "https://ivyleaguehouse.com/wp-content/uploads/2024/05/ILH-Favicon-150x150.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
