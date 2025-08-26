// app/me/layout.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "./components/Sidebar";

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[#141414] text-white flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-neutral-800">
        <Sidebar />
      </aside>

      {/* Main */}
      <div className="flex-1 flex min-w-0 flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
