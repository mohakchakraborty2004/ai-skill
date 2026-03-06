"use client";
import Image from "next/image";
import { Inter, Caveat } from "next/font/google";
import { use } from "react";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });
const cursive = Caveat({ subsets: ["latin"], weight: ["400", "700"] });

export default function Home() {
  const navigate = useRouter();
  return (
    <main
      className={`h-screen w-screen bg-black text-white ${inter.className} overflow-hidden flex flex-col`}
    >
      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full p-8 flex items-center gap-4 z-20">
        <div className="w-10 h-10 rounded-full border-2 border-[#b026ff] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <span className="text-[#b026ff] font-bold text-xs">DI</span>
        </div>
        <h1 className="text-2xl font-bold tracking-widest text-white">
          DEV INSIGHT
        </h1>
      </nav>

      {/* Hero */}
      <div className="flex flex-1 h-full">

        {/* Left */}
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

          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate.push("/getScore")}
              className="px-8 py-4 bg-[#b026ff] hover:bg-[#9015d8] text-white font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(176,38,255,0.6)]">
              Start Evaluation
            </button>
            <button className="px-8 py-4 bg-transparent border border-gray-700 hover:border-[#b026ff] text-gray-300 hover:text-white transition-all duration-300">
              View Sample Profile
            </button>
          </div>
        </div>

        {/* Right — image panel */}
        <div className="hidden md:block w-1/2 h-full relative border-l border-gray-900">
          {/* blend gradients */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black via-black/30 to-transparent" />
          <div className="absolute inset-0 z-10 bg-[#b026ff] mix-blend-overlay opacity-20" />

          <Image
            src="/purple.jpeg"
            alt="Developer coding in dark mode"
            fill
            priority
            className="object-cover contrast-125"
          />
        </div>

      </div>
    </main>
  );
}