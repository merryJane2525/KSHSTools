import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/app/_components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me || me.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
