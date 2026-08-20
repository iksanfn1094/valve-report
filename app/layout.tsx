import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Valve Inspection Report",
  description: "Sistem Inspection Report Pekerjaan Valve Maintenance",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <header className="bg-blue-900 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Valve Inspection Report
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/reports" className="hover:text-blue-200 transition">
                Reports
              </Link>
              <Link href="/reports/new" className="hover:text-blue-200 transition">
                + New Report
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <footer className="bg-gray-200 text-center text-xs py-2 text-gray-500">
          Valve Maintenance Inspection Report System
        </footer>
      </body>
    </html>
  );
}
