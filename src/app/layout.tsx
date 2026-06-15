import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import AuthGuard from "@/components/auth/AuthGuard";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinanceApp – Finanzas Personales",
  description:
    "Gestiona tus gastos, ingresos, ahorros e inversiones de manera inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased bg-[#0a0b0f] text-white">
        <AppProvider>
          <AuthGuardWrapper>{children}</AuthGuardWrapper>
        </AppProvider>
      </body>
    </html>
  );
}

// Wrapper that skips auth guard on /login
function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  // We can't use hooks in Server Components directly.
  // AuthGuard itself reads the pathname on the client.
  // For /login we skip the guard entirely by rendering children directly.
  // The AuthGuard component handles the redirect logic client-side.
  return <AuthGuard>{children}</AuthGuard>;
}
