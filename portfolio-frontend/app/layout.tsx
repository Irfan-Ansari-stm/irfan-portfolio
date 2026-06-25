import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Irfan Ansari — Full Stack Developer",
  description: "Portfolio of Irfan Ansari, a Full Stack Developer specializing in React, Node.js, and PostgreSQL.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-slate-200 font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#0d1117", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)" },
            success: { iconTheme: { primary: "#22c55e", secondary: "#090c10" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#090c10" } },
          }}
        />
      </body>
    </html>
  );
}
