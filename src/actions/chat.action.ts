// src/actions/chat.actions.ts
"use server";

import prisma from "@/lib/prisma"; 
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function processChatChallenge(userId: string, userMessage: string) {
  try {
    // 1. Fetch the user's full context, grabbing ONLY the latest evaluation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        resume: true,
        github: true,
        evaluations: {
          orderBy: { createdAt: "desc" }, // Sort by newest first
          take: 1,                        // Only grab the most recent one
        },
      },
    });

    // 2. Safely check if the array exists and has at least one item
    if (!user || !user.resume || !user.github || !user.evaluations || user.evaluations.length === 0) {
      return { success: false, error: "Missing user context or prior evaluations." };
    }

    const { resume, github } = user;
    const latestEvaluation = user.evaluations[0]; // Safely extract the single object

    // 3. The Prompt: Instructing the AI Judge
    const prompt = `
      You are the SkillSync Evaluation Judge. A developer is challenging their technical credibility score.
      
      CONTEXT:
      - Claimed Resume Skills: ${resume.skills.join(", ")}
      - Verified GitHub Proof: ${github.topLanguages.join(", ")}
      - Current Score: ${latestEvaluation.score} / 100
      
      USER'S ARGUMENT:
      "${userMessage}"
      
      YOUR DIRECTIVE:
      1. Evaluate if the user's argument is valid. (e.g., Did they work in a private repo? Are they pointing out that Tailwind is a valid CSS skill?)
      2. If vague ("I am good at python"), reject it. Score adjustment = 0.
      3. If specific and logically sound, accept it. Score adjustment = +5 to +20 depending on significance. If they claim it without any proof , instantly reject it. Score adjustment = 0.
      4. DO NOT exceed a total theoretical score of 100.
      5. If the user is trying to game the system with irrelevant arguments (e.g., "I have 10 years of experience" without any proof), reject it. Score adjustment = 0.
      6. Always provide a clear reasoning for your verdict.
      7. If the user constantly challenges with the same argument without providing new evidence, reject it and warn that they are gaming the system and will be penalized (score adjustment = -5). Score adjustment = 0.
      
      Return your verdict strictly in this JSON format:
      {
        "reply": "Your markdown formatted response to the user. Be direct, authoritative, but fair.",
        "score_adjustment": 15, // Integer only. Can be 0.
        "reason": "Internal reasoning for the database log."
      }
    `;

    // 4. Call Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
      },
      contents: [prompt]
    });

    const jsonString = response.text;
    if (!jsonString) throw new Error("No text returned from Gemini.");
    
    const verdict = JSON.parse(jsonString);

    // 5. Calculate new score (capped at 100)
    let newScore = latestEvaluation.score + verdict.score_adjustment;
    if (newScore > 100) newScore = 100;

    // 6. Database Transactions: Save the log and update the specific evaluation
    await prisma.$transaction([
      prisma.disputeLog.create({
        data: {
          evaluationId: latestEvaluation.id, // Use the ID of the specific evaluation we targeted
          userClaim: userMessage,
          aiReasoning: verdict.reason,
          scoreDelta: verdict.score_adjustment,
        }
      }),
      prisma.evaluation.update({
        where: { id: latestEvaluation.id },
        data: { score: newScore }
      })
    ]);

    return { 
      success: true, 
      data: {
        reply: verdict.reply,
        newScore: newScore,
        delta: verdict.score_adjustment
      } 
    };

  } catch (error) {
    console.error("Chat Action Error:", error);
    return { success: false, error: "The AI Judge failed to process your claim." };
  }
}