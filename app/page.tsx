import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const session = await getSession();

  if (session) {
    if (session.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
