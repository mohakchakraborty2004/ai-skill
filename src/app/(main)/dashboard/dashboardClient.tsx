// src/app/dashboard/DashboardClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { processChatChallenge } from "@/actions/chat.action";

interface DashboardClientProps {
  initialData: any; 
}

type Message = {
  id: string;
  role: "system" | "judge" | "user";
  content: string;
  isMarkdown?: boolean;
};

export default function DashboardClient({ initialData }: DashboardClientProps) {
  // --- State Management ---
  const [data, setData] = useState(initialData);
  const [isJudgeOpen, setIsJudgeOpen] = useState(false); 
  const [activeTab, setActiveTab] = useState<string>("overview"); // Accordion state
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "system", content: "> AI EVALUATION JUDGE INITIALIZED..." },
    { id: "2", role: "judge", content: "I am ready to review your dispute. Please provide specific repositories or context I may have missed during the initial automated scan." }
  ]);
  const [challengeInput, setChallengeInput] = useState("");
  const [isJudging, setIsJudging] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const github = data.github;
  const resume = data.resume;
  const evaluation = data.evaluations[0];
  const disputes = evaluation.disputes || [];
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${github.username}&backgroundColor=transparent`;

  // --- Handlers ---
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isJudgeOpen]);

  const toggleTab = (tab: string) => {
    setActiveTab(prev => prev === tab ? "" : tab);
  };

  const addMessage = (role: Message["role"], content: string, isMarkdown = false) => {
    setMessages((prev) => [...prev, { id: Math.random().toString(), role, content, isMarkdown }]);
  };

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeInput.trim() || isJudging) return;

    const userText = challengeInput;
    setChallengeInput("");
    addMessage("user", userText);
    setIsJudging(true);

    try {
      const chatRes = await processChatChallenge(data.id, userText);
      if (!chatRes.success || !chatRes.data) throw new Error(chatRes.error);

      addMessage("judge", chatRes.data.reply, true);

      if (chatRes.data.delta > 0) {
        addMessage("system", `> SYSTEM OVERRIDE: +${chatRes.data.delta} points awarded.`);
        
        setData((prev: any) => {
          const newData = { ...prev };
          newData.evaluations[0].score = chatRes.data.newScore;
          newData.evaluations[0].disputes = [
            {
              id: Math.random().toString(),
              createdAt: new Date(),
              userClaim: userText,
              aiReasoning: chatRes.data.reply,
              scoreDelta: chatRes.data.delta,
            },
            ...newData.evaluations[0].disputes
          ];
          return newData;
        });
      }
    } catch (err: any) {
      addMessage("judge", `**Error:** ${err.message}`, true);
    } finally {
      setIsJudging(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-gray-200 p-6 md:p-12 font-sans selection:bg-[#b026ff]/30">
      
      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between pb-8 mb-8 border-b border-[#1a1a1a] gap-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#0a0a0a] border border-[#2a0d45] flex items-center justify-center overflow-hidden relative shadow-[0_0_20px_rgba(176,38,255,0.1)]">
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover p-2" unoptimized />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">{data.name || "Developer"}</h1>
            <p className="text-[#b026ff] font-mono text-sm mt-1">github.com/{github.username}</p>
          </div>
        </div>

        <button 
          onClick={() => setIsJudgeOpen(!isJudgeOpen)}
          className={`px-6 py-3 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(176,38,255,0.2)] ${
            isJudgeOpen 
              ? "bg-transparent border border-gray-700 text-gray-400 hover:text-white" 
              : "bg-[#12051c] border border-[#b026ff] text-[#b026ff] hover:bg-[#b026ff] hover:text-white"
          }`}
        >
          {isJudgeOpen ? "Close AI Judge" : "Access AI Judge"}
        </button>
      </header>

      <div className="max-w-7xl mx-auto w-full">
        
        {/* ================= STATE 1: FULL DASHBOARD (GRID) ================= */}
        {!isJudgeOpen && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#b026ff] opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Current Score</p>
                <p className="text-4xl font-black text-white">{evaluation.score} <span className="text-lg text-gray-600 font-normal">/ 100</span></p>
              </div>
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Baseline Score</p>
                <p className="text-2xl font-bold text-gray-300">{evaluation.baselineScore}</p>
              </div>
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Total Commits</p>
                <p className="text-2xl font-bold text-gray-300">{github.totalCommits}</p>
              </div>
              <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Disputes Won</p>
                <p className="text-2xl font-bold text-gray-300">
                  {disputes.filter((d: any) => d.scoreDelta > 0).length} <span className="text-sm text-gray-600 font-normal">/ {disputes.length}</span>
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Skills Column */}
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-[#1a1a1a]">Claimed Resume Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-[#111] border border-[#333] text-gray-300 text-xs rounded-md">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-[#1a1a1a]">Verified GitHub Proof</h3>
                  <div className="flex flex-wrap gap-2">
                    {github.topLanguages.map((lang: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-[#12051c] border border-[#2a0d45] text-[#d48cff] text-xs rounded-md font-medium">{lang}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transcripts Column */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#b026ff]"></div>
                  Judge Transcripts & Dispute Logs
                </h2>
                {disputes.length === 0 ? (
                  <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-8 text-center">
                    <p className="text-gray-500 text-sm">No disputes logged. This profile's baseline score was accepted without challenge.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {disputes.map((dispute: any) => (
                      <div key={dispute.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 transition hover:border-[#2a0d45]">
                        <div className="flex items-start justify-between mb-4">
                          <p className="text-xs text-gray-500 font-mono">{new Date(dispute.createdAt).toLocaleString()}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${dispute.scoreDelta > 0 ? "bg-green-950/30 text-green-400 border border-green-900/50" : "bg-gray-900 text-gray-400 border border-gray-800"}`}>
                            {dispute.scoreDelta > 0 ? `+${dispute.scoreDelta} Points Awarded` : "Claim Rejected"}
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div className="pl-4 border-l-2 border-gray-800">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">User Claim</p>
                            <p className="text-gray-300 text-sm leading-relaxed">"{dispute.userClaim}"</p>
                          </div>
                          <div className="pl-4 border-l-2 border-[#b026ff]">
                            <p className="text-xs text-[#b026ff] font-bold uppercase mb-1">AI Reasoning</p>
                            <p className="text-gray-300 text-sm leading-relaxed">{dispute.aiReasoning}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STATE 2: COMPACTED ACCORDION + JUDGE TERMINAL ================= */}
        {isJudgeOpen && (
          <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-8 duration-500">
            
            {/* LEFT: Accordion */}
            <div className="w-full md:w-1/3 flex flex-col gap-4 custom-scrollbar overflow-y-auto pr-2">
              
              {/* Tab 1: Overview */}
              <div className="border border-[#1a1a1a] rounded-xl bg-[#050505] overflow-hidden">
                <button onClick={() => toggleTab("overview")} className="w-full p-5 flex justify-between items-center bg-[#0a0a0a] hover:bg-[#111] transition-colors">
                  <span className="font-bold text-white tracking-wider text-sm">OVERVIEW METRICS</span>
                  <span className="text-[#b026ff] text-xl font-mono">{activeTab === "overview" ? "−" : "+"}</span>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${activeTab === "overview" ? "max-h-[500px] opacity-100 p-5 border-t border-[#1a1a1a]" : "max-h-0 opacity-0 overflow-hidden"}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black border border-[#2a0d45] rounded-lg p-4 relative">
                      <div className="absolute inset-0 bg-[#b026ff] opacity-10"></div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 relative z-10">Score</p>
                      <p className="text-3xl font-black text-white relative z-10">{evaluation.score}</p>
                    </div>
                    <div className="bg-black border border-[#1a1a1a] rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Baseline</p>
                      <p className="text-2xl font-bold text-gray-300">{evaluation.baselineScore}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab 2: Skills */}
              <div className="border border-[#1a1a1a] rounded-xl bg-[#050505] overflow-hidden">
                <button onClick={() => toggleTab("skills")} className="w-full p-5 flex justify-between items-center bg-[#0a0a0a] hover:bg-[#111] transition-colors">
                  <span className="font-bold text-white tracking-wider text-sm">SKILLS VS PROOF</span>
                  <span className="text-[#b026ff] text-xl font-mono">{activeTab === "skills" ? "−" : "+"}</span>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${activeTab === "skills" ? "max-h-[800px] opacity-100 p-5 border-t border-[#1a1a1a]" : "max-h-0 opacity-0 overflow-hidden"}`}>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Claimed on Resume</p>
                      <div className="flex flex-wrap gap-2">
                        {resume.skills.map((s: string, i: number) => <span key={i} className="px-2 py-1 bg-[#111] border border-[#333] text-gray-400 text-xs rounded">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#b026ff] uppercase tracking-widest mb-3">Verified on GitHub</p>
                      <div className="flex flex-wrap gap-2">
                        {github.topLanguages.map((l: string, i: number) => <span key={i} className="px-2 py-1 bg-[#12051c] border border-[#2a0d45] text-[#d48cff] text-xs rounded">{l}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab 3: Transcripts */}
              <div className="border border-[#1a1a1a] rounded-xl bg-[#050505] overflow-hidden">
                <button onClick={() => toggleTab("transcripts")} className="w-full p-5 flex justify-between items-center bg-[#0a0a0a] hover:bg-[#111] transition-colors">
                  <span className="font-bold text-white tracking-wider text-sm">TRANSCRIPTS</span>
                  <span className="text-[#b026ff] text-xl font-mono">{activeTab === "transcripts" ? "−" : "+"}</span>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar ${activeTab === "transcripts" ? "max-h-[400px] opacity-100 p-5 border-t border-[#1a1a1a]" : "max-h-0 opacity-0 overflow-hidden"}`}>
                  {disputes.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No disputes logged.</p>
                  ) : (
                    <div className="space-y-4">
                      {disputes.map((d: any) => (
                        <div key={d.id} className="bg-black border border-[#1a1a1a] rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] text-gray-600 font-mono">{new Date(d.createdAt).toLocaleDateString()}</p>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm ${d.scoreDelta > 0 ? "bg-[#b026ff]/20 text-[#d48cff]" : "bg-gray-900 text-gray-500"}`}>
                              {d.scoreDelta > 0 ? `+${d.scoreDelta} PTS` : "REJECTED"}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs italic">"{d.userClaim}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT: Terminal */}
            <div className="w-full md:w-2/3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl relative overflow-hidden flex flex-col shadow-2xl">
              <div className="h-14 border-b border-[#1a1a1a] flex items-center px-6 bg-black/50 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isJudging ? "bg-yellow-500 animate-pulse" : "bg-[#b026ff] shadow-[0_0_8px_rgba(176,38,255,0.8)]"}`}></div>
                  <h3 className="text-xs font-bold text-gray-400 tracking-widest">AI EVALUATION TERMINAL</h3>
                </div>
              </div>

              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "system" && <div className="text-gray-500 font-mono text-xs w-full">{msg.content}</div>}
                    {msg.role === "judge" && (
                      <div className="max-w-[85%] bg-[#12051c] border border-[#2a0d45] rounded-2xl rounded-tl-sm p-4 shadow-lg">
                        {msg.isMarkdown ? (
                          <div className="prose prose-invert prose-purple max-w-none text-sm leading-relaxed prose-headings:text-white prose-a:text-[#b026ff]">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : <p className="text-gray-300 text-sm">{msg.content}</p>}
                      </div>
                    )}
                    {msg.role === "user" && (
                      <div className="max-w-[75%] bg-[#1a1a1a] border border-[#333] rounded-2xl rounded-tr-sm p-3">
                        <p className="text-gray-200 text-sm">{msg.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-black border-t border-[#1a1a1a]">
                <form onSubmit={handleChallengeSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    value={challengeInput}
                    onChange={(e) => setChallengeInput(e.target.value)}
                    disabled={isJudging}
                    placeholder="Dispute your score... (e.g. 'You missed my private AWS repo')"
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm rounded-xl py-3 pl-4 pr-28 focus:outline-none focus:border-[#b026ff] focus:ring-1 focus:ring-[#b026ff] transition-all"
                  />
                  <button type="submit" disabled={!challengeInput.trim() || isJudging} className="absolute right-2 top-1.5 bottom-1.5 bg-[#b026ff] hover:bg-[#9015d8] text-white text-xs font-bold px-4 rounded-lg transition-all disabled:opacity-50">
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #b026ff; }
      `}} />
    </main>
  );
}