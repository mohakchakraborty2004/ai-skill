// src/app/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { getAuthenticatedUserId } from "@/actions/user.actions";
import { processGithubProfile } from "@/actions/github.actions";
import { processResume } from "@/actions/resume.actions";
import { generateEvaluation } from "@/actions/evaluations.action";
import { processChatChallenge } from "@/actions/chat.action";

// Define the structure for our chat/terminal messages
type Message = {
  id: string;
  role: "system" | "judge" | "user";
  content: string;
  isMarkdown?: boolean;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  // Chat Judge State
  const [messages, setMessages] = useState<Message[]>([]);
  const [challengeInput, setChallengeInput] = useState("");
  const [isJudging, setIsJudging] = useState(false);
  const [disputesRemaining, setDisputesRemaining] = useState(5);
  const isLocked = disputesRemaining <= 0;
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: Message["role"], content: string, isMarkdown = false) => {
    setMessages((prev) => [...prev, { id: Math.random().toString(), role, content, isMarkdown }]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasStarted(true);
    setLoading(true);
    setError("");
    setResult(null);
    setMessages([]); // Reset chat

    const formData = new FormData(e.currentTarget);
    const githubUsername = formData.get("githubUsername") as string;
    const resumeFile = formData.get("resume") as File;

    if (!githubUsername || !resumeFile || resumeFile.size === 0) {
      setError("Please provide both a GitHub username and a Resume PDF.");
      setLoading(false);
      return;
    }

    try {
      addMessage("system", "> Initializing secure environment...");
      const userId = await getAuthenticatedUserId();

      addMessage("system", `> Scanning GitHub profile for @${githubUsername}...`);
      const githubRes = await processGithubProfile(userId, githubUsername);
      if (!githubRes.success) throw new Error(githubRes.error);
      addMessage("system", `> Found GitHub data. Extracting contribution graph & language distributions...`);

      addMessage("system", "> Parsing Resume PDF via Vision AI...");
      const resumeRes = await processResume(userId, formData);
      if (!resumeRes.success) throw new Error(resumeRes.error);
      addMessage("system", "> Extracted skill matrix. Aligning claims vs cryptographic proof...");

      addMessage("system", "> Analyzing complexity & calculating final credibility score...");
      const evalRes = await generateEvaluation(userId);
      
      if (!evalRes.success || !evalRes.data) {
        console.error("Evaluation error:", evalRes.error);
        throw new Error("Failed to generate evaluation.");
      }

      setResult({
        score: evalRes.data.score,
        feedback: evalRes.data.feedback,
      });

      // Post the final evaluation as the Judge
      addMessage("judge", evalRes.data.feedback, true);

    } catch (err: any) {
      setError(err.message || "Something went wrong during evaluation.");
      addMessage("system", `> ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mock handler for challenging the score (We will wire this to a Server Action next)
const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeInput.trim() || isJudging) return;

    const userText = challengeInput;
    setChallengeInput("");
    addMessage("user", userText);
    setIsJudging(true);

    try {
      const userId = await getAuthenticatedUserId();

      const chatRes = await processChatChallenge(userId, userText);

      // Handle chamber lock
      if (!chatRes.success && (chatRes as any).locked) {
        addMessage("system", `> CHAMBER LOCKED: All 5 dispute attempts exhausted. Score is final.`);
        setDisputesRemaining(0);
        return;
      }

      if (!chatRes.success || !chatRes.data) {
        throw new Error(chatRes.error);
      }

      // 1. Post the AI's response in the chat
      addMessage("judge", chatRes.data.reply, true);

      // 2. Update disputes remaining
      setDisputesRemaining(chatRes.data.disputesRemaining);

      if (chatRes.data.disputesRemaining <= 0) {
        addMessage("system", `> CHAMBER LOCKED: Final dispute used. Score is now permanent.`);
      }

      // 3. If the score changed, update the UI's big glowing score!
      if (chatRes.data.delta > 0) {
        setResult(prev => prev ? { ...prev, score: chatRes.data.newScore } : null);
        addMessage("system", `> SYSTEM OVERRIDE: Score recalibrated. +${chatRes.data.delta} points awarded. [${chatRes.data.disputesRemaining} chambers remaining]`);
      } else {
        addMessage("system", `> Claim rejected. [${chatRes.data.disputesRemaining} chambers remaining]`);
      }

    } catch (err: any) {
      addMessage("judge", `**Error:** I could not process that request right now. ${err.message}`, true);
    } finally {
      setIsJudging(false);
    }
  };
  return (
    <main className="min-h-screen bg-black text-white p-6 overflow-hidden flex items-center justify-center font-sans">
      
      <div 
        className={`w-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col md:flex-row gap-6 ${
          hasStarted ? "max-w-7xl items-stretch h-[85vh]" : "max-w-xl items-center justify-center"
        }`}
      >
        
        {/* ================= LEFT PANEL: The Input & Results ================= */}
        <div 
          className={`bg-[#050505] border border-[#1a1a1a] rounded-2xl shadow-2xl p-8 transition-all duration-700 relative z-10 flex flex-col overflow-y-auto custom-scrollbar ${
            hasStarted ? "w-full md:w-1/3" : "w-full"
          }`}
        >
          <div className="absolute inset-0 bg-[#b026ff] opacity-[0.03] pointer-events-none"></div>

          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Skill Sync</h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Upload your resume and link your GitHub to cryptographically verify your technical claims.
          </p>

          {/* If result exists, show the score prominently here */}
          {result && (
            <div className="mb-8 p-6 bg-black border border-[#2a0d45] rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#b026ff] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-2 relative z-10">Baseline Score</h2>
              <div className="text-6xl font-black text-white relative z-10 drop-shadow-[0_0_15px_rgba(176,38,255,0.5)]">
                {result.score}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10 flex-1">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">GitHub Username</label>
              <input
                type="text"
                name="githubUsername"
                placeholder="e.g., torvalds"
                disabled={loading || !!result}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-white focus:ring-1 focus:ring-[#b026ff] focus:border-[#b026ff] outline-none transition-all disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resume (PDF)</label>
              <input
                type="file"
                name="resume"
                accept="application/pdf"
                disabled={loading || !!result}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#1a0529] file:text-[#b026ff] hover:file:bg-[#2a0d45] outline-none transition-all cursor-pointer disabled:opacity-50"
                required
              />
            </div>

            {!result && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#b026ff] hover:bg-[#9015d8] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 shadow-[0_0_15px_rgba(176,38,255,0.2)]"
              >
                {loading ? "Initializing..." : "Calculate Score"}
              </button>
            )}
          </form>

          {error && <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-sm">{error}</div>}
        </div>

        {/* ================= RIGHT PANEL: The Live Chat Judge ================= */}
        {hasStarted && (
          <div className="w-full md:w-2/3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl relative overflow-hidden flex flex-col transition-all duration-700 animate-in fade-in slide-in-from-right-8">
            
            {/* Header */}
            <div className="h-16 border-b border-[#1a1a1a] flex items-center px-6 bg-black/50 backdrop-blur-md z-20">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"}`}></div>
                <h3 className="text-sm font-bold text-gray-200 tracking-wider">AI EVALUATION JUDGE</h3>
              </div>
            </div>

            {/* Message Area */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  
                  {/* System Terminal Messages */}
                  {msg.role === "system" && (
                    <div className="text-gray-500 font-mono text-xs w-full animate-in fade-in slide-in-from-bottom-2">
                      {msg.content}
                    </div>
                  )}

                  {/* AI Judge Messages */}
                  {msg.role === "judge" && (
                    <div className="max-w-[85%] bg-[#12051c] border border-[#2a0d45] rounded-2xl rounded-tl-sm p-5 shadow-lg animate-in fade-in slide-in-from-left-4">
                      {msg.isMarkdown ? (
                        <div className="prose prose-invert prose-purple max-w-none text-sm leading-relaxed prose-headings:text-white prose-a:text-[#b026ff]">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-gray-300 text-sm">{msg.content}</p>
                      )}
                    </div>
                  )}

                  {/* User Dispute Messages */}
                  {msg.role === "user" && (
                    <div className="max-w-[75%] bg-[#1a1a1a] border border-[#333] rounded-2xl rounded-tr-sm p-4 animate-in fade-in slide-in-from-right-4">
                      <p className="text-gray-200 text-sm">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {isJudging && (
                <div className="flex justify-start">
                  <div className="bg-[#12051c] border border-[#2a0d45] rounded-2xl rounded-tl-sm p-4 flex gap-2 items-center">
                    <div className="w-2 h-2 bg-[#b026ff] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#b026ff] rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-2 h-2 bg-[#b026ff] rounded-full animate-bounce [animation-delay:-.5s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Footer (Only visible when baseline evaluation is done) */}
            {result && (
              <div className="p-4 bg-black border-t border-[#1a1a1a]">
                {isLocked ? (
                  <div className="text-center py-3 px-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                    <p className="text-red-400 text-xs font-bold tracking-wider">CHAMBER LOCKED — ALL 5 DISPUTES EXHAUSTED</p>
                    <p className="text-gray-500 text-[10px] mt-1">Your score is now final and cannot be challenged further.</p>
                  </div>
                ) : (
                  <form onSubmit={handleChallengeSubmit} className="relative flex items-center">
                    <input
                      type="text"
                      value={challengeInput}
                      onChange={(e) => setChallengeInput(e.target.value)}
                      disabled={isJudging}
                      placeholder={`Dispute your score... (${disputesRemaining} chamber${disputesRemaining !== 1 ? "s" : ""} remaining)`}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm rounded-xl py-4 pl-4 pr-32 focus:outline-none focus:border-[#b026ff] focus:ring-1 focus:ring-[#b026ff] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!challengeInput.trim() || isJudging}
                      className="absolute right-2 top-2 bottom-2 bg-[#b026ff] hover:bg-[#9015d8] text-white text-xs font-bold px-4 rounded-lg transition-all disabled:opacity-50"
                    >
                      Challenge
                    </button>
                  </form>
                )}
              </div>
            )}
            
          </div>
        )}
      </div>

      {/* Global styles for custom scrollbar hidden in tailwind */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #b026ff; }
      `}} />
    </main>
  );
}