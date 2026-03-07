// src/actions/evaluation.actions.ts
"use server";

import prisma from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1alpha" 
});

export async function generateEvaluation(userId: string) {
  try {
    // 1. Fetch all data for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        resume: true,
        github: true,
      },
    });

    if (!user || !user.resume || !user.github) {
      return { success: false, error: "Missing resume or github data to run evaluation." };
    }

    const { resume, github } = user;

    // 2. The Math: Calculate Alignment ($S_{align}$)
    const claimedSkills = resume.skills.map(s => s.toLowerCase());
    const provenLanguages = github.topLanguages.map(l => l.toLowerCase());
    
    const matchedSkills = claimedSkills.filter(skill => 
      provenLanguages.some(lang => lang.includes(skill) || skill.includes(lang))
    );
    
    // Avoid division by zero if they uploaded an empty resume
    const sAlign = claimedSkills.length > 0 
      ? (matchedSkills.length / claimedSkills.length) * 100 
      : 0;

    // 3. The Math: Activity Density ($A_{dens}$)
    // For MVP, assuming totalCommits reflects recent active repos (max 20 for 100%)
    const aDens = Math.min((github.totalCommits / 20) * 100, 100);

    // 4. The Math: Complexity ($P_{comp}$)
    // For MVP, assuming 50 total stars = 100% complexity score
    const pComp = Math.min((github.totalStars / 50) * 100, 100);

    // 5. Final Weighted Score
    const finalScore = Math.round((sAlign * 0.5) + (aDens * 0.3) + (pComp * 0.2));

    // 6. AI Roadmap / Feedback Generation
    const prompt = `
      You are an expert technical mentor. A candidate scored ${finalScore}/100 on their skill credibility test.
      They claim these skills on their resume: ${resume.skills.join(", ")}.
      But their GitHub only proves they use: ${github.topLanguages.join(", ")}.
      
      Write a short, direct, 3-step action plan to help them bridge this gap and improve their GitHub portfolio. 
      Keep it actionable and strictly under 100 words. Do not use pleasantries.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt]
    });

    const feedbackText = response.text || "Keep building and pushing code to GitHub to improve your score!";

    // 7. Save the Evaluation
const evaluation = await prisma.evaluation.upsert({
      where: { 
        userId: userId 
      },
      update: {
        score: finalScore,
        baselineScore: finalScore,
        feedback: feedbackText,
      },
      create: {
        userId: userId,
        score: finalScore,
        baselineScore: finalScore,
        feedback: feedbackText,
      }
    });

    return { success: true, data: evaluation };

  } catch (error) {
    console.error("Evaluation Error:", error);
    return { success: false, error: error };
  }
}