import Link from "next/link";
import { getUserRole } from "@/lib/utils/role";

export default function Sidebar() {
  const role = getUserRole();

  return (
    <aside className="w-60 border-r h-screen p-4">
      <nav className="space-y-2">
        {role === "ADMIN" && (
          <>
            <Link href="/admin">Admin Dashboard</Link>
            <Link href="/assignments">All Assignments</Link>
          </>
        )}

        {role === "TEACHER" && (
          <>
            <Link href="/teacher">Teacher Dashboard</Link>
            <Link href="/assignments">My Assignments</Link>
          </>
        )}

        {role === "STUDENT" && (
          <>
            <Link href="/student">Student Dashboard</Link>
            <Link href="/assignments">Assignments</Link>
          </>
        )}
      </nav>
    </aside>
  );
}
