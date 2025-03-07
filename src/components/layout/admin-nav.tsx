import { Link } from "next/navigation";
import { IconDashboard, IconBrain } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = "/admin/dashboard";

  return (
    <nav className="grid items-start gap-2">
      <Link
        href="/admin/dashboard"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
          pathname === "/admin/dashboard" ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <IconDashboard className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
      <Link
        href="/admin/settings/llm"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
          pathname === "/admin/settings/llm" ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <IconBrain className="h-4 w-4" />
        <span>AI Model Settings</span>
      </Link>
    </nav>
  );
} 