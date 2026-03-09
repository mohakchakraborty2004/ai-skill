"use client";
import Image from "next/image";
import { Inter, Caveat } from "next/font/google";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });
const cursive = Caveat({ subsets: ["latin"], weight: ["400", "700"] });

export default function Home() {
  const router = useRouter();

  return (
    <main
      className={`min-h-screen w-full bg-black text-white ${inter.className} overflow-x-hidden selection:bg-[#b026ff]/30`}
    >
      {/* Navbar (Fixed so it stays while scrolling) */}
      <nav className="fixed top-0 left-0 w-full p-6 md:p-8 flex items-center justify-between z-50 bg-black/50 backdrop-blur-md border-b border-transparent transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#b026ff] flex items-center justify-center bg-black/80 shadow-[0_0_10px_rgba(176,38,255,0.3)]">
            <span className="text-[#b026ff] font-bold text-xs">DI</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white">
            DEV INSIGHT
          </h1>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-400">
          <a href="#features" className="hover:text-[#b026ff] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#b026ff] transition-colors">The Algorithm</a>
          <button onClick={() => router.push("/dashboard")} className="hover:text-white transition-colors">Sign In</button>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-screen flex w-full pt-20">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative z-10">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-[#b026ff] opacity-10 blur-[100px] rounded-full pointer-events-none" />

          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6">
            Prove your skills. <br />
            <span
              className={`${cursive.className} text-[#b026ff] font-normal text-5xl md:text-6xl lg:text-8xl block mt-2`}
            >
              Not your keywords.
            </span>
          </h2>

          <p className="text-gray-400 text-lg md:text-xl max-w-md mb-10 leading-relaxed">
            Connect your GitHub and upload your resume. Our AI evaluation engine
            cross-references your claims with your actual code to generate a
            verified credibility score.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <button
              onClick={() => router.push("/getScore")}
              className="w-full sm:w-auto px-8 py-4 bg-[#b026ff] hover:bg-[#9015d8] text-white font-semibold rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)]"
            >
              Start Evaluation
            </button>
            <button 
              onClick={() => router.push("/p/sample-dev")} 
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-gray-700 hover:border-[#b026ff] text-gray-300 hover:text-white rounded-lg transition-all duration-300"
            >
              View Public Dossier
            </button>
          </div>
        </div>

        <div className="hidden md:block w-1/2 h-full relative border-l border-[#1a1a1a]">
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/30 to-transparent" />
          <div className="absolute inset-0 z-10 bg-[#b026ff] mix-blend-overlay opacity-20" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-20" />

          <Image
            src="/purple.jpeg" 
            alt="Developer coding in dark mode"
            fill
            priority
            className="object-cover contrast-125"
          />
        </div>
      </section>

      {/* ================= SEPARATED FEATURE SECTIONS ================= */}
      <div id="features" className="bg-black">
        
        {/* Feature 1: Code-Level Verification (Text Left, Image Right) */}
        <section className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-16 border-b border-[#1a1a1a]">
          <div className="w-full md:w-1/2 space-y-6">
            <h3 className={`${cursive.className} text-[#b026ff] text-5xl md:text-7xl font-normal leading-tight`}>
              Code-Level Verification
            </h3>
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
              We don't just read your resume. We pull your live GitHub GraphQL data—analyzing commit density, repository complexity, and language distribution to mathematically prove you actually write the code you claim.
            </p>
            <ul className="space-y-3 mt-8">
              {['Commit Frequency Analysis', 'Repository Complexity Scoring', 'Language Syntax Matching'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-[#b026ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/2">
            <div className="aspect-square md:aspect-[4/3] bg-[#050505] border border-[#1a1a1a] rounded-2xl relative overflow-hidden flex items-center justify-center group shadow-[0_0_30px_rgba(176,38,255,0.05)]">
              <div className="absolute inset-0 bg-[#b026ff] opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
              {/* Mockup Terminal */}
              <div className="w-3/4 h-3/4 bg-black border border-[#222] rounded-lg p-4 shadow-2xl flex flex-col relative z-10">
                <div className="flex gap-2 mb-4 border-b border-[#222] pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <pre className="text-[#b026ff] font-mono text-xs overflow-hidden opacity-80">
                  <code className="block mb-2 text-gray-500">{"// FETCHING GITHUB GRAPHQL"}</code>
                  <code className="block">{"{"}</code>
                  <code className="block ml-4">{"user(login: \"developer\") {"}</code>
                  <code className="block ml-8 text-gray-300">{"contributionsCollection {"}</code>
                  <code className="block ml-12 text-[#d48cff]">{"totalCommitContributions"}</code>
                  <code className="block ml-8 text-gray-300">{"}"}</code>
                  <code className="block ml-4">{"}"}</code>
                  <code className="block">{"}"}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: The AI Chat Judge (Image Left, Text Right) */}
        <section className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 border-b border-[#1a1a1a]">
          <div className="w-full md:w-1/2">
            <div className="aspect-square md:aspect-[4/3] bg-[#050505] border border-[#1a1a1a] rounded-2xl relative overflow-hidden flex items-center justify-center group shadow-[0_0_30px_rgba(176,38,255,0.05)]">
              <div className="absolute inset-0 bg-[#b026ff] opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
              {/* Mockup Chat Interface */}
              <div className="w-3/4 flex flex-col gap-4 relative z-10">
                <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-2xl rounded-tr-sm self-end max-w-[80%]">
                  <p className="text-xs text-gray-300">My commits are low because I work mostly in private AWS repositories.</p>
                </div>
                <div className="bg-[#12051c] border border-[#2a0d45] p-4 rounded-2xl rounded-tl-sm self-start max-w-[85%] shadow-[0_0_15px_rgba(176,38,255,0.1)]">
                  <p className="text-xs text-[#d48cff] mb-2 font-mono">{"> JUDGE_VERDICT"}</p>
                  <p className="text-xs text-gray-300">Valid defense. I have adjusted your complexity multiplier to account for private infrastructure.</p>
                  <p className="text-xs font-bold text-white mt-2">+12 Points Awarded</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <h3 className={`${cursive.className} text-[#b026ff] text-5xl md:text-7xl font-normal leading-tight`}>
              The AI Chat Judge
            </h3>
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
              Think your initial score is unfair? Defend yourself. Argue your case to our autonomous AI Evaluation Terminal. If your technical defense holds up against scrutiny, your score updates in real-time.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#12051c] border border-[#2a0d45] px-4 py-2 rounded-full text-sm text-[#d48cff] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#b026ff] animate-pulse"></span>
              5 Defense Attempts Allowed
            </div>
          </div>
        </section>

        {/* Feature 3: Self-Learning Engine (Text Left, Image Right) */}
        <section className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-16 border-b border-[#1a1a1a]">
          <div className="w-full md:w-1/2 space-y-6">
            <h3 className={`${cursive.className} text-[#b026ff] text-5xl md:text-7xl font-normal leading-tight`}>
              Self-Learning Engine
            </h3>
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
              Powered by an RLHF (Reinforcement Learning from Human Feedback) loop. Every peer review and successfully won chat dispute triggers gradient descent, autonomously updating the algorithm's global evaluation weights.
            </p>
            <ul className="space-y-3 mt-8">
              {['Dynamic Score Adjustments', 'Public Dossier Audits', 'Mathematical Convergence'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-[#b026ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/2">
            <div className="aspect-square md:aspect-[4/3] bg-[#050505] border border-[#1a1a1a] rounded-2xl relative overflow-hidden flex items-center justify-center group shadow-[0_0_30px_rgba(176,38,255,0.05)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(176,38,255,0.1)_0%,transparent_60%)]"></div>
              {/* Mockup Math / Graph */}
              <div className="text-center relative z-10 w-full px-12">
                <div className="flex justify-between items-end h-32 mb-4 border-b border-[#222] pb-2 gap-4">
                  <div className="w-1/3 bg-gray-800 rounded-t-sm transition-all duration-1000 h-[40%] group-hover:h-[50%]"></div>
                  <div className="w-1/3 bg-[#b026ff] rounded-t-sm transition-all duration-1000 h-[80%] shadow-[0_0_15px_rgba(176,38,255,0.5)]"></div>
                  <div className="w-1/3 bg-gray-800 rounded-t-sm transition-all duration-1000 h-[60%] group-hover:h-[40%]"></div>
                </div>
                <p className="text-[#b026ff] font-mono text-xs mb-1 uppercase tracking-widest">Global Weights Optimizing...</p>
                <p className="text-gray-500 font-mono text-[10px]">W_new = W_old + α(W_prop - W_old)</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="py-24 bg-[#050505] border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Stop fighting <br />
              <span className={`${cursive.className} text-[#b026ff] font-normal text-5xl md:text-7xl block mt-2`}>
                the system.
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Traditional hiring relies on recruiters guessing your technical depth based on bullet points. Dev Insight flips the script. We provide a transparent, immutable dashboard that proves exactly what you can do.
            </p>
            <ul className="space-y-6">
              {[
                "Upload Resume & Connect GitHub",
                "AI extracts claims & verifies repository proof",
                "Receive Baseline Score (0-100)",
                "Dispute via Chat or invite Peers to review"
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-4 text-gray-300 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-[#12051c] border border-[#2a0d45] text-[#b026ff] flex items-center justify-center text-sm shrink-0">
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/2 relative">
             <div className="aspect-square rounded-2xl border border-[#2a0d45] bg-black relative overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(176,38,255,0.1)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(176,38,255,0.15)_0%,transparent_70%)]"></div>
                <div className="text-center z-10">
                  <p className="text-xs text-gray-500 tracking-widest uppercase font-bold mb-2">Verified Score</p>
                  <p className="text-7xl md:text-8xl font-black text-white">92<span className="text-2xl md:text-4xl text-gray-600">/100</span></p>
                  <div className="mt-4 px-4 py-1.5 bg-[#b026ff]/20 border border-[#b026ff] text-[#d48cff] text-xs rounded-full font-bold shadow-[0_0_10px_rgba(176,38,255,0.3)]">
                    +15 Pts (Dispute Won)
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-12 text-center bg-black">
        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded border border-[#b026ff] flex items-center justify-center bg-black">
            <span className="text-[#b026ff] font-bold text-[8px]">DI</span>
          </div>
          <span className="text-white font-bold tracking-widest text-sm">DEV INSIGHT</span>
        </div>
        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} Dev Insight. The self-optimizing credential network.
        </p>
      </footer>
    </main>
  );
}