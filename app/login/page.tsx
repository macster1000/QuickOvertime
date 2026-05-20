import { db } from "@/lib/db";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Query all active employees to fill the dropdown menu
  const employees = await db.employee.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      role: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main style={{
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      background: "radial-gradient(circle at 10% 20%, var(--primary-glow) 0%, transparent 40%), radial-gradient(circle at 90% 80%, var(--primary-glow) 0%, transparent 40%)"
    }}>
      <LoginForm employees={employees} />
    </main>
  );
}
