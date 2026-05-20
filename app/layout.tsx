import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickOvertime | HNO-Praxis",
  description: "Einfache, präzise und schnelle Überstundenerfassung für HNO-Praxen und Arztpraxen.",
  keywords: "Überstunden, Zeiterfassung, HNO-Praxis, Arztpraxis, Überstundenkonto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
