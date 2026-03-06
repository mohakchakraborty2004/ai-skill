// src/app/page.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { getOrCreateTestUser } from "@/actions/user.actions";
import { processGithubProfile } from "@/actions/github.actions";
import { processResume } from "@/actions/resume.actions";
import { generateEvaluation } from "@/actions/evaluations.action"; // Make sure file name matches your project

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Triggers the layout shift
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHasStarted(true); // Trigger the smooth slide animation
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const githubUsername = formData.get("githubUsername") as string;
    const resumeFile = formData.get("resume") as File;

    if (!githubUsername || !resumeFile || resumeFile.size === 0) {
      setError("Please provide both a GitHub username and a Resume PDF.");
      setLoading(false);
      return;
    }

    try {
      setStep("Initializing User...");
      const userId = await getOrCreateTestUser();

      setStep("Fetching GitHub Data...");
      const githubRes = await processGithubProfile(userId, githubUsername);
      if (!githubRes.success) throw new Error(githubRes.error);

      setStep("Analyzing Resume with Gemini...");
      const resumeRes = await processResume(userId, formData);
      if (!resumeRes.success) throw new Error(resumeRes.error);

      setStep("Calculating Credibility Score...");
      const evalRes = await generateEvaluation(userId);
      
      if (!evalRes.success || !evalRes.data) {
        throw new Error(evalRes.error || "Failed to generate evaluation.");
      }

      setResult({
        score: evalRes.data.score,
        feedback: evalRes.data.feedback,
      });
      setStep("Evaluation Complete.");
    } catch (err: any) {
      setError(err.message || "Something went wrong during evaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 overflow-hidden flex items-center justify-center">
      {/* The outer wrapper controls the flex layout. 
        When hasStarted is false, it centers the 1st div. 
        When true, it expands to 6xl and puts them side-by-side. 
      */}
      <div 
        className={`w-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col md:flex-row gap-6 ${
          hasStarted ? "max-w-6xl items-stretch" : "max-w-xl items-center justify-center"
        }`}
      >
        
        {/* LEFT PANEL: The Form */}
        <div 
          className={`w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl shadow-2xl p-8 transition-all duration-700 relative z-10 ${
            hasStarted ? "md:w-1/3" : "w-full"
          }`}
        >
          {/* Subtle purple glow behind the card */}
          <div className="absolute inset-0 bg-[#b026ff] opacity-5 blur-[100px] rounded-full pointer-events-none"></div>

          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
            Skill Sync
          </h1>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Upload your resume and link your GitHub to cryptographically verify your technical claims.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                name="githubUsername"
                placeholder="e.g., torvalds"
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-[#b026ff] focus:border-[#b026ff] outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Resume (PDF)
              </label>
              <input
                type="file"
                name="resume"
                accept="application/pdf"
                className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#b026ff]/10 file:text-[#b026ff] hover:file:bg-[#b026ff]/20 outline-none transition-all cursor-pointer"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#b026ff] hover:bg-[#9015d8] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(176,38,255,0.3)] hover:shadow-[0_0_25px_rgba(176,38,255,0.6)]"
            >
              {loading ? "Processing..." : "Calculate Score"}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-sm relative z-10">
              {error}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Loading / Results */}
        {hasStarted && (
          <div 
            className="w-full md:w-2/3 bg-[#050505] border border-[#1f1f1f] rounded-2xl p-8 lg:p-12 relative overflow-hidden flex flex-col transition-all duration-700 animate-in fade-in slide-in-from-right-8"
          >
            {loading ? (
              /* Shimmering Loading State */
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 h-full min-h-[400px]">
                {/* Pulsing purple orb */}
                <div className="w-24 h-24 rounded-full border border-[#b026ff]/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#b026ff] animate-spin"></div>
                  <div className="w-16 h-16 bg-[#b026ff] rounded-full blur-xl animate-pulse opacity-40"></div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-clip-text text-transparent animate-pulse">
                    Evaluating Profile
                  </h3>
                  <p className="text-[#b026ff] font-mono text-sm tracking-widest animate-pulse">
                    {step}
                  </p>
                </div>
              </div>
            ) : result ? (
              /* Final Result State */
              <div className="flex-1 animate-in fade-in duration-500">
                <div className="flex items-start justify-between mb-10 pb-6 border-b border-[#1f1f1f]">
                  <div>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Final Assessment
                    </h2>
                    <h3 className="text-3xl font-bold text-white">Credibility Report</h3>
                  </div>
                  
                  {/* Glowing Score Badge */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#b026ff] blur-lg opacity-50 rounded-full"></div>
                    <div className="relative bg-black border-2 border-[#b026ff] px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(176,38,255,0.4)]">
                      <span className="text-3xl font-black text-white">{result.score}</span>
                      <span className="text-gray-400 font-bold text-lg">/ 100</span>
                    </div>
                  </div>
                </div>
                
                {/* Markdown Rendering Container */}
                <div className="prose prose-invert prose-purple max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mt-6 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-200 mt-5 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold text-[#b026ff] mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
                    }}
                  >
                    {result.feedback}
                  </ReactMarkdown>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}