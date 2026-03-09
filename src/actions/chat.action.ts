// src/actions/chat.actions.ts
"use server";

import prisma from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { getGlobalWeights, applyWeightUpdate } from "@/lib/weights";

const DISPUTE_CAP = 5;      // 5-Chamber Rule: max disputes per user
const SCORE_DELTA_CAP = 15;  // +15 Point Cap: max points per dispute
const LEARNING_RATE = 0.05;  // α for Loop A (Candidate Defense)

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function processChatChallenge(userId: string, userMessage: string) {
  try {
    // 1. Fetch the user's full context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        resume: true,
        github: true,
        evaluations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || !user.resume || !user.github || !user.evaluations || user.evaluations.length === 0) {
      return { success: false, error: "Missing user context or prior evaluations." };
    }

    const { resume, github } = user;
    const latestEvaluation = user.evaluations[0];

    // 2. 5-Chamber Rule: Check if the user has disputes remaining
    if (latestEvaluation.disputesRemaining <= 0) {
      return {
        success: false,
        error: "CHAMBER LOCKED: You have exhausted all 5 dispute attempts. Your score is now final.",
        locked: true,
      };
    }

    // 3. Fetch current global weights for AI context
    const currentWeights = await getGlobalWeights();

    // 4. The Prompt: AI Judge with backpropagation directive
    const prompt = `
      You are the SkillSync Evaluation Judge. A developer is challenging their technical credibility score.

      CONTEXT:
      - Claimed Resume Skills: ${resume.skills.join(", ")}
      - Verified GitHub Proof: ${github.topLanguages.join(", ")}
      - Current Score: ${latestEvaluation.score} / 100
      - Baseline Score: ${latestEvaluation.baselineScore} / 100
      - Disputes Remaining: ${latestEvaluation.disputesRemaining} / ${DISPUTE_CAP}

      CURRENT GLOBAL SCORING WEIGHTS:
      - Skill Alignment Weight: ${currentWeights.skillWeight}
      - Activity Density Weight: ${currentWeights.densityWeight}
      - Project Complexity Weight: ${currentWeights.complexityWeight}

      USER'S ARGUMENT:
      "${userMessage}"

      YOUR DIRECTIVE:
      1. Evaluate if the user's argument is valid. (e.g., Did they work in a private repo? Are they pointing out that Tailwind is a valid CSS skill?)
      2. If vague ("I am good at python"), reject it. Score adjustment = 0.
      3. If specific and logically sound, accept it. Score adjustment = +1 to +15 depending on significance. NEVER exceed +15.
      4. DO NOT exceed a total theoretical score of 100.
      5. If the user is trying to game the system with irrelevant arguments, reject with score_adjustment = 0.
      6. Always provide clear reasoning for your verdict.

      BACKPROPAGATION DIRECTIVE (CRITICAL):
      If you ACCEPT the user's dispute (score_adjustment > 0), it means the global algorithm may have penalized this user unfairly.
      In that case, you MUST propose new ideal weights that would have scored this user more fairly.
      The three weights (skill, density, complexity) must sum to 1.0.
      Think about WHY the algorithm was unfair — was it overweighting skills vs activity vs complexity?

      If you REJECT the dispute, set all proposed weights to 0 (meaning no weight update needed).

      Return your verdict strictly in this JSON format:
      {
        "reply": "Your markdown formatted response to the user. Be direct, authoritative, but fair. Mention they have N-1 disputes remaining.",
        "score_adjustment": 10,
        "reason": "Internal reasoning for the database log.",
        "proposed_skill_weight": 0.45,
        "proposed_density_weight": 0.35,
        "proposed_complexity_weight": 0.20
      }
    `;

    // 5. Call Gemini
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

    // 6. GUARDRAIL: Aggressively clamp the score delta to +15 cap
    let clampedDelta = Math.max(0, Math.min(SCORE_DELTA_CAP, verdict.score_adjustment));

    // 7. Calculate new score (capped at 100)
    let newScore = latestEvaluation.score + clampedDelta;
    if (newScore > 100) newScore = 100;

    // 8. Database Transaction: Save log, update score, decrement disputes remaining
    await prisma.$transaction(async (tx) => {
      await tx.disputeLog.create({
        data: {
          evaluationId: latestEvaluation.id,
          userClaim: userMessage,
          aiReasoning: verdict.reason,
          scoreDelta: clampedDelta,
          // Store the proposed weights for audit trail
          proposedSkillWeight: clampedDelta > 0 ? verdict.proposed_skill_weight : null,
          proposedDensityWeight: clampedDelta > 0 ? verdict.proposed_density_weight : null,
          proposedComplexityWeight: clampedDelta > 0 ? verdict.proposed_complexity_weight : null,
          weightUpdateApplied: clampedDelta > 0,
        }
      });
      await tx.evaluation.update({
        where: { id: latestEvaluation.id },
        data: {
          score: newScore,
          disputesRemaining: { decrement: 1 },
        }
      });
    }, { maxWait: 10000, timeout: 15000 });

    // 9. BACKPROPAGATION (Loop A): If dispute was won, nudge global weights
    if (clampedDelta > 0 && verdict.proposed_skill_weight && verdict.proposed_density_weight && verdict.proposed_complexity_weight) {
      // Validate proposed weights sum to ~1.0
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

    const remainingDisputes = latestEvaluation.disputesRemaining - 1;

    return {
      success: true,
      data: {
        reply: verdict.reply,
        newScore: newScore,
        delta: clampedDelta,
        disputesRemaining: remainingDisputes,
      }
    };

  } catch (error) {
    console.error("Chat Action Error:", error);
    return { success: false, error: "The AI Judge failed to process your claim." };
  }
}
