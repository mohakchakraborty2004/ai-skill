// src/actions/peer.actions.ts
"use server";

import db from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { getGlobalWeights, applyWeightUpdate } from "@/lib/weights";

const LEARNING_RATE = 0.10; // α for Loop B (Peer Review / Market Truth) — higher than disputes

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

    // 2. Fetch current global weights for AI context
    const currentWeights = await getGlobalWeights();

    // 3. Calculate the Loss: humanScore vs systemScore
    const loss = humanScore - latestEvaluation.score;

    // 4. The Stealth AI Prompt with backpropagation directive
    const prompt = `
      You are the SkillSync Evaluation Judge. A peer reviewer has evaluated this candidate.

      CONTEXT:
      - Claimed Skills: ${resume?.skills.join(", ")}
      - Verified GitHub Proof: ${github?.topLanguages.join(", ")}
      - Current System Score: ${latestEvaluation.score} / 100
      - Peer's Suggested Score: ${humanScore} / 100
      - Loss (Human - System): ${loss}

      CURRENT GLOBAL SCORING WEIGHTS:
      - Skill Alignment Weight: ${currentWeights.skillWeight}
      - Activity Density Weight: ${currentWeights.densityWeight}
      - Project Complexity Weight: ${currentWeights.complexityWeight}

      PEER REVIEW DATA:
      - Reviewer Role: ${reviewerRole}
      - Reviewer Remarks: "${remarks}"

      YOUR DIRECTIVE:
      1. Evaluate the peer's remarks. If they provide valid, technical reasoning that aligns with or corrects the candidate's skills, accept the adjustment.
      2. If the remarks are spam, lack technical depth, or seem like a bot, reject (score_adjustment = 0).
      3. Weight the reviewer's credibility based on their role:
         - "Senior Software Engineer", "Staff Engineer", "Engineering Manager", "CTO" → High credibility (trust their assessment more)
         - "Junior Developer", "Student" → Medium credibility
         - Vague or unrecognizable roles → Low credibility
      4. Score adjustment should move the system score SLIGHTLY toward the peer's score. Range: -5 to +5.

      BACKPROPAGATION DIRECTIVE (CRITICAL):
      The Loss between the human score and the system score is: ${loss}.
      If you accept this peer review (score_adjustment ≠ 0), you MUST propose new ideal weights that would close this loss gap.
      Think about what the loss tells you:
      - If loss > 0: The system is UNDERVALUING this developer. Maybe skill alignment is too strict, or complexity is underweighted.
      - If loss < 0: The system is OVERVALUING this developer. Maybe activity density is too generous.
      The three weights must sum to 1.0.

      If you reject the review, set all proposed weights to 0.

      Return your verdict strictly in this JSON format:
      {
        "internal_transcript": "Your internal reasoning. The profile owner will see this, but the reviewer will NOT. Explain why you accepted or rejected the peer's feedback and what the loss tells you.",
        "score_adjustment": 3,
        "proposed_skill_weight": 0.48,
        "proposed_density_weight": 0.30,
        "proposed_complexity_weight": 0.22
      }
    `;

    // 5. Execute Gemini Evaluation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: [prompt]
    });

    const jsonString = response.text;
    if (!jsonString) throw new Error("No text returned from AI.");

    const verdict = JSON.parse(jsonString);

    // 6. Clamp score adjustment to [-5, +5]
    let clampedDelta = Math.max(-5, Math.min(5, verdict.score_adjustment));

    // 7. Calculate new score securely
    let newScore = latestEvaluation.score + clampedDelta;
    if (newScore > 100) newScore = 100;
    if (newScore < 0) newScore = 0;

    // 8. Stealth Transaction: Save raw peer rating, AI audit log, and update score
    await db.$transaction([
      db.peerRating.create({
        data: {
          evaluationId: latestEvaluation.id,
          humanScore: humanScore,
          reviewerRole: reviewerRole,
          remarks: remarks,
          // Backpropagation audit trail
          systemScoreAtTime: latestEvaluation.score,
          proposedSkillWeight: clampedDelta !== 0 ? verdict.proposed_skill_weight : null,
          proposedDensityWeight: clampedDelta !== 0 ? verdict.proposed_density_weight : null,
          proposedComplexityWeight: clampedDelta !== 0 ? verdict.proposed_complexity_weight : null,
          weightUpdateApplied: clampedDelta !== 0,
        }
      }),
      // Log the AI's internal transcript as a DisputeLog (visible only on owner's dashboard)
      db.disputeLog.create({
        data: {
          evaluationId: latestEvaluation.id,
          userClaim: `PEER REVIEW (${reviewerRole}): ${remarks}`,
          aiReasoning: verdict.internal_transcript,
          scoreDelta: clampedDelta,
        }
      }),
      db.evaluation.update({
        where: { id: latestEvaluation.id },
        data: { score: newScore }
      })
    ]);

    // 9. BACKPROPAGATION (Loop B): If review was accepted, nudge global weights
    if (clampedDelta !== 0 && verdict.proposed_skill_weight && verdict.proposed_density_weight && verdict.proposed_complexity_weight) {
      const proposedSum = verdict.proposed_skill_weight + verdict.proposed_density_weight + verdict.proposed_complexity_weight;
      if (Math.abs(proposedSum - 1.0) < 0.05) {
        await applyWeightUpdate(
          {
            skillWeight: verdict.proposed_skill_weight,
            densityWeight: verdict.proposed_density_weight,
            complexityWeight: verdict.proposed_complexity_weight,
          },
          LEARNING_RATE
        );
      }
    }

    // 10. Return ONLY a success boolean to the public client. No transcripts leak. (Stealth Mode)
    return { success: true };

  } catch (error) {
    console.error("Peer Rating Error:", error);
    return { success: false, error: "Failed to record response." };
  }
}
