// src/actions/peer.actions.ts
"use server";

import db from "@/lib/prisma"; 
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function submitPeerRating(
  username: string, 
  humanScore: number, 
  remarks: string, 
  reviewerRole: string
) {
  try {
    // 1. Fetch the user's current context based on the public username
    const user = await db.user.findFirst({
      where: { github: { username: username } },
      include: {
        resume: true,
        github: true,
        evaluations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || !user.evaluations || user.evaluations.length === 0) {
      return { success: false, error: "Profile not found or not evaluated yet." };
    }

    const { resume, github } = user;
    const latestEvaluation = user.evaluations[0];

    // 2. The Stealth AI Prompt
    const prompt = `
      You are the SkillSync Evaluation Judge. A peer reviewer has evaluated this candidate.
      
      CONTEXT:
      - Claimed Skills: ${resume?.skills.join(", ")}
      - Verified GitHub Proof: ${github?.topLanguages.join(", ")}
      - Current Score: ${latestEvaluation.score} / 100
      
      PEER REVIEW DATA:
      - Reviewer Role: ${reviewerRole}
      - Reviewer's Suggested Score: ${humanScore} / 100
      - Reviewer Remarks: "${remarks}"
      
      YOUR DIRECTIVE:
      Evaluate the peer's remarks. If they provide valid, technical reasoning that aligns with or corrects the candidate's skills, adjust the score slightly towards the peer's suggested score. 
      If the remarks are spam or lack technical depth, reject the adjustment (Score adjustment = 0).
      
      Return your verdict strictly in this JSON format:
      {
        "internal_transcript": "Your internal reasoning. The profile owner will see this, but the reviewer will not. Explain why you accepted or rejected the peer's feedback.",
        "score_adjustment": 5 // Integer only. Can be negative, positive, or 0.
      }
    `;

    // 3. Execute Gemini Evaluation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: [prompt]
    });

    const jsonString = response.text;
    if (!jsonString) throw new Error("No text returned from AI.");
    
    const verdict = JSON.parse(jsonString);

    // 4. Calculate new score securely
    let newScore = latestEvaluation.score + verdict.score_adjustment;
    if (newScore > 100) newScore = 100;
    if (newScore < 0) newScore = 0;

    // 5. Save the transaction. 
    // We log the AI's internal transcript as a DisputeLog so it shows up on the owner's dashboard.
    // We also save the raw PeerRating.
    await db.$transaction([
      db.peerRating.create({
        data: {
          evaluationId: latestEvaluation.id,
          humanScore: humanScore,
          reviewerRole: reviewerRole,
          remarks: remarks,
        }
      }),
      db.disputeLog.create({
        data: {
          evaluationId: latestEvaluation.id,
          userClaim: `PEER REVIEW (${reviewerRole}): ${remarks}`,
          aiReasoning: verdict.internal_transcript, // Only the owner will see this in their dashboard!
          scoreDelta: verdict.score_adjustment,
        }
      }),
      db.evaluation.update({
        where: { id: latestEvaluation.id },
        data: { score: newScore }
      })
    ]);

    // 6. Return ONLY a success boolean to the public client. No transcripts leak.
    return { success: true };

  } catch (error) {
    console.error("Peer Rating Error:", error);
    return { success: false, error: "Failed to record response." };
  }
}