// src/actions/resume.actions.ts
"use server";

import { GoogleGenAI, PartMediaResolutionLevel } from "@google/genai";
import prisma from "@/lib/prisma";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1alpha" 
});

export async function processResume(userId: string, formData: FormData) {
  try {
    const file = formData.get("resume") as File;
    if (!file) {
      return { success: false, error: "No resume file provided." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = `
      You are an expert technical recruiter. Analyze this resume.
      Extract the data into this EXACT JSON structure:
      {
        "skills": ["list", "of", "technical", "skills", "like", "Next.js", "TypeScript"],
        "experience": 3 // Total years of professional or project experience as an integer
      }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
        },
        contents: [
          prompt, // Just pass the text string directly
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            }
          }
        ]
      });

    const jsonString = response.text;
    if (!jsonString) {
        throw new Error("No text returned from Gemini.");
    }
    
    const extractedData = JSON.parse(jsonString);

    const savedResume = await prisma.resumeData.upsert({
      where: { userId: userId },
      update: {
        skills: extractedData.skills,
        experience: extractedData.experience,
      },
      create: {
        userId: userId,
        skills: extractedData.skills,
        experience: extractedData.experience,
      }
    });

    return { success: true, data: savedResume };

  } catch (error) {
    console.error("Resume Processing Error:", error);
    return { success: false, error: "Failed to process resume." };
  }
}