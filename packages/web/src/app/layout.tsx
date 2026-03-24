import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "wpbot Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
