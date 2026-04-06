import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "IEO Admin Dashboard",
  description: "IEO Matchmaking Premium Admin Panel",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("ieo_admin_auth");

  return (
    <html lang="ko">
      <body className="antialiased font-sans bg-[#F9FAFB] text-gray-900 min-h-screen">
        {isLoggedIn && <Sidebar />}
        <main className={isLoggedIn ? "pl-64 flex flex-col min-h-screen" : "flex flex-col min-h-screen"}>
          <div className={isLoggedIn ? "flex-1 p-8" : "flex-1"}>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
