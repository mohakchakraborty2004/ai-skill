"use client";

import { useState } from "react";
import { submitPeerRating } from "@/actions/peer.action";

export default function PeerReviewForm({ username }: { username: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const score = Number(formData.get("score"));
    const role = formData.get("role") as string;
    const remarks = formData.get("remarks") as string;

    const res = await submitPeerRating(username, score, remarks, role);
    
    if (res.success) {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="h-full bg-[#050505] border border-[#1a1a1a] rounded-xl p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-[#b026ff]/20 border border-[#b026ff] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#b026ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Response Recorded</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your peer review has been securely transmitted to the AI Evaluation Engine. Thank you for contributing to the ground truth data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-8 shadow-2xl">
      <h2 className="text-lg font-bold text-white mb-1">Submit Peer Review</h2>
      <p className="text-xs text-gray-500 mb-6">Your feedback directly trains the evaluation algorithm.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            True Skill Assessment (0-100)
          </label>
          <input 
            type="range" 
            name="score" 
            min="0" 
            max="100" 
            defaultValue="50"
            className="w-full accent-[#b026ff]" 
            required 
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
            <span>0 (Novice)</span>
            <span>100 (Expert)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Role</label>
          <input
            type="text"
            name="role"
            placeholder="e.g. Senior Software Engineer"
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-white text-sm focus:ring-1 focus:ring-[#b026ff] outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Validation Remarks</label>
          <textarea
            name="remarks"
            rows={4}
            placeholder="Explain why their current score is inaccurate..."
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-lg text-white text-sm focus:ring-1 focus:ring-[#b026ff] outline-none transition-all resize-none custom-scrollbar"
            required
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#b026ff] hover:bg-[#9015d8] text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(176,38,255,0.2)] disabled:opacity-50"
        >
          {loading ? "Transmitting..." : "Submit Verification"}
        </button>
      </form>
    </div>
  );
}