// src/app/dashboard/page.tsx

import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Home from "./generateEval";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");


  if (!session.userId) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">No Evaluation Found</h1>
        <Link href="/" className="px-6 py-3 bg-[#b026ff] hover:bg-[#9015d8] rounded-lg font-bold transition">
          Go to login
        </Link>
      </div>
    );
  }

  // Pass the data to the interactive client component
  return <Home />;
}


