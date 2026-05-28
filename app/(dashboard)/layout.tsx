"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
