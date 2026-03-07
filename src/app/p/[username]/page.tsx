// src/app/p/[username]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import db from "@/lib/prisma";
import PeerReviewForm from "./PeerReviewForm";

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  // Fetch the full public dossier including the past disputes
  const user = await db.user.findFirst({
    where: { github: { username: username } },
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
    notFound(); 
  }

  const github = user.github!;
  const resume = user.resume!;
  const evaluation = user.evaluations[0];
  const disputes = evaluation.disputes || [];
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${github.username}&backgroundColor=transparent`;

  return (
    <main className="min-h-screen bg-black text-gray-200 p-6 md:p-12 font-sans selection:bg-[#b026ff]/30">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 items-start">
        
        {/* ================= LEFT COLUMN: THE DOSSIER ================= */}
        <div className="w-full lg:w-2/3 space-y-10">
          
          {/* Header */}
          <div className="flex items-center gap-6 pb-6 border-b border-[#1a1a1a]">
            <div className="w-24 h-24 rounded-2xl bg-[#0a0a0a] border border-[#2a0d45] flex items-center justify-center overflow-hidden relative shadow-[0_0_20px_rgba(176,38,255,0.15)]">
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover p-2" unoptimized />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide">{user.name || "Developer"}</h1>
              <a 
                href={`https://github.com/${github.username}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-[#b026ff] hover:text-[#d48cff] font-mono text-sm mt-1 transition flex items-center gap-2"
              >
                github.com/{github.username} ↗
              </a>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#b026ff] opacity-[0.03] group-hover:opacity-10 transition-opacity"></div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 relative z-10">AI Score</p>
              <p className="text-4xl font-black text-white relative z-10">{evaluation.score} <span className="text-base text-gray-600 font-normal">/ 100</span></p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Baseline</p>
              <p className="text-2xl font-bold text-gray-300">{evaluation.baselineScore}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Commits</p>
              <p className="text-2xl font-bold text-gray-300">{github.totalCommits}</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Disputes Won</p>
              <p className="text-2xl font-bold text-gray-300">
                {disputes.filter(d => d.scoreDelta > 0).length} <span className="text-sm text-gray-600 font-normal">/ {disputes.length}</span>
              </p>
            </div>
          </div>

          {/* Skills vs Proof */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-[#1a1a1a]">Claimed Resume Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-[#111] border border-[#333] text-gray-300 text-xs rounded-md">{skill}</span>
                ))}
              </div>
            </div>
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-xs font-bold text-[#b026ff] uppercase tracking-wider mb-4 pb-2 border-b border-[#1a1a1a]">Verified GitHub Proof</h3>
              <div className="flex flex-wrap gap-2">
                {github.topLanguages.map((lang, i) => (
                  <span key={i} className="px-3 py-1 bg-[#12051c] border border-[#2a0d45] text-[#d48cff] text-xs rounded-md font-medium">{lang}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Judge Transcripts */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#b026ff]"></div>
              Public Audit Logs & AI Transcripts
            </h2>

            {disputes.length === 0 ? (
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">No disputes logged. The baseline score was accepted.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-xs text-gray-500 font-mono">
                        {new Date(dispute.createdAt).toLocaleString()}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        dispute.scoreDelta > 0 
                          ? "bg-green-950/30 text-green-400 border border-green-900/50" 
                          : "bg-gray-900 text-gray-400 border border-gray-800"
                      }`}>
                        {dispute.scoreDelta > 0 ? `+${dispute.scoreDelta} Points` : "Rejected"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="pl-4 border-l-2 border-gray-800">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Developer Defense</p>
                        <p className="text-gray-300 text-sm leading-relaxed">"{dispute.userClaim}"</p>
                      </div>
                      <div className="pl-4 border-l-2 border-[#b026ff]">
                        <p className="text-[10px] text-[#b026ff] font-bold uppercase tracking-widest mb-1">AI Verdict</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{dispute.aiReasoning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PEER REVIEW FORM (STICKY) ================= */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-6">
            <PeerReviewForm username={github.username} />
          </div>
        </div>

      </div>
    </main>
  );
}