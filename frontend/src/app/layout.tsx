import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Riset — Ruang kerja penelitian",
    template: "%s | Riset",
  },
  description: "Kumpulkan artikel, petakan hubungan antarpenelitian, dan diskusikan temuan dalam satu ruang kerja riset.",
};

export default function RootLayout(
  {children}: {children: React.ReactNode}
){
  return(
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
