// src/lib/weights.ts
// Shared utility for the self-learning weight system (AI-driven backpropagation)

import prisma from "@/lib/prisma";

export interface Weights {
  skillWeight: number;
  densityWeight: number;
  complexityWeight: number;
}

/**
 * Fetch the current global weights, initializing them if they don't exist.
 */
export async function getGlobalWeights(): Promise<Weights> {
  const weights = await prisma.systemWeights.upsert({
    where: { id: "global_weights" },
    update: {},
    create: {
      id: "global_weights",
      skillWeight: 0.50,
      densityWeight: 0.30,
      complexityWeight: 0.20,
    },
  });

  return {
    skillWeight: weights.skillWeight,
    densityWeight: weights.densityWeight,
    complexityWeight: weights.complexityWeight,
  };
}

/**
 * Apply the weight update rule: W_new = W_old + α(W_proposed - W_old)
 * Normalizes weights to always sum to 1.0 after the update.
 */
export async function applyWeightUpdate(
  proposed: Weights,
  learningRate: number
): Promise<Weights> {
  const current = await getGlobalWeights();

  // Gradient step: W_new = W_old + α(W_proposed - W_old)
  let newSkill = current.skillWeight + learningRate * (proposed.skillWeight - current.skillWeight);
  let newDensity = current.densityWeight + learningRate * (proposed.densityWeight - current.densityWeight);
  let newComplexity = current.complexityWeight + learningRate * (proposed.complexityWeight - current.complexityWeight);

  // Clamp to [0.05, 0.90] to prevent any single weight from dominating or dying
  newSkill = Math.max(0.05, Math.min(0.90, newSkill));
  newDensity = Math.max(0.05, Math.min(0.90, newDensity));
  newComplexity = Math.max(0.05, Math.min(0.90, newComplexity));

  // Normalize so weights always sum to 1.0
  const sum = newSkill + newDensity + newComplexity;
  newSkill = parseFloat((newSkill / sum).toFixed(4));
  newDensity = parseFloat((newDensity / sum).toFixed(4));
  newComplexity = parseFloat((1 - newSkill - newDensity).toFixed(4)); // Ensure exact sum of 1.0

  await prisma.systemWeights.update({
    where: { id: "global_weights" },
    data: {
      skillWeight: newSkill,
      densityWeight: newDensity,
      complexityWeight: newComplexity,
      totalUpdates: { increment: 1 },
    },
  });

  return { skillWeight: newSkill, densityWeight: newDensity, complexityWeight: newComplexity };
}
