import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CashFlow Manager — Enterprise Treasury & Double-Entry Accounting",
  description: "Double-entry bookkeeping, multi-entity treasury management, live cash registers, and immutable audit logs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}

