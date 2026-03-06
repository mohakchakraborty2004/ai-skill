// src/app/dashboard/page.tsx
import prisma from "@/lib/prisma"; // Adjust to your db path
import DashboardClient from "./dashboardClient";
import Link from "next/link";

export default async function DashboardPage() {
  // Fetching the user and their relations
  const user = await prisma.user.findFirst({
    where: { email: "test@zynvo.com" }, // Replace with actual session logic later
    include: {
      github: true,
      resume: true,
      evaluations: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          disputes: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!user || !user.evaluations || user.evaluations.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">No Evaluation Found</h1>
        <Link href="/" className="px-6 py-3 bg-[#b026ff] hover:bg-[#9015d8] rounded-lg font-bold transition">
          Go to Evaluator
        </Link>
      </div>
    );
  }

  // Pass the data to the interactive client component
  return <DashboardClient initialData={user} />;
}


