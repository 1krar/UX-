import { GoogleGenAI, Type, Schema } from "@google/genai";
import { JourneyMapData, IANode, DesignSystemData } from '../types';

// Initialize GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// Helper to clean JSON strings from Markdown code blocks
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  // Remove ```json ... ``` or ``` ... ``` wrappers
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
};

// --- Schemas ---

const journeyMapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    persona: { type: Type.STRING, description: "The user persona description" },
    scenario: { type: Type.STRING, description: "The scenario being mapped" },
    stages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stageName: { type: Type.STRING },
          userGoal: { type: Type.STRING },
          actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          emotionScore: { type: Type.NUMBER, description: "1 to 5" }, // Changed to NUMBER for safety
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["stageName", "userGoal", "actions", "painPoints", "emotionScore", "opportunities"]
      }
    }
  },
  required: ["persona", "scenario", "stages"]
};

// Design System Schema
const designSystemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    themeName: { type: Type.STRING },
    primaryColors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, hex: { type: Type.STRING }, usage: { type: Type.STRING } },
        required: ["name", "hex", "usage"]
      }
    },
    secondaryColors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, hex: { type: Type.STRING }, usage: { type: Type.STRING } },
        required: ["name", "hex", "usage"]
      }
    },
    neutralColors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, hex: { type: Type.STRING }, usage: { type: Type.STRING } },
        required: ["name", "hex", "usage"]
      }
    },
    typography: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { 
            role: { type: Type.STRING }, 
            size: { type: Type.STRING }, 
            weight: { type: Type.STRING }, 
            usage: { type: Type.STRING } 
        },
        required: ["role", "size", "weight", "usage"]
      }
    }
  },
  required: ["themeName", "primaryColors", "secondaryColors", "neutralColors", "typography"]
};


// --- Service Functions ---

export const generateJourneyMap = async (topic: string): Promise<JourneyMapData> => {
  const prompt = `Act as a senior UX researcher. Create a detailed User Journey Map for: "${topic}". 
  The output must be in Chinese (Simplified). Include specific stages, user goals, actions, pain points, emotion scores (1-5), and opportunities.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: journeyMapSchema,
        temperature: 0.7,
      },
    });

    const text = cleanJson(response.text || "");
    if (!text || text === "{}") throw new Error("AI returned empty response");
    return JSON.parse(text) as JourneyMapData;
  } catch (error) {
    console.error("Gemini API Error (JourneyMap):", error);
    throw new Error("无法生成旅程图，请稍后重试或检查网络");
  }
};

export const generateIA = async (topic: string): Promise<IANode> => {
  const prompt = `Act as a Information Architect. Create a hierarchical Information Architecture (Sitemap) for: "${topic}".
  The output must be in Chinese (Simplified). The root node should be the home page or main app container. 
  Ensure a nested structure suitable for a D3 tree visualization. 
  
  IMPORTANT: Return a RAW JSON object that strictly adheres to this recursive structure:
  {
    "name": "Root Name",
    "type": "page",
    "children": [
      { "name": "Child", "type": "page", "children": [...] }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const text = cleanJson(response.text || "");
    if (!text || text === "{}") throw new Error("AI returned empty response");
    return JSON.parse(text) as IANode;
  } catch (error) {
    console.error("Gemini API Error (IA):", error);
    throw new Error("无法生成架构图，请稍后重试");
  }
};

export const generateDesignSystem = async (topic: string): Promise<DesignSystemData> => {
  const prompt = `Act as a UI Designer. Create a mini Design System documentation for a digital product about: "${topic}".
  The output must be in Chinese (Simplified).
  1. Define a "themeName".
  2. Create a color palette with Primary, Secondary, and Neutral colors. Provide Hex codes and usage rules.
  3. Define a basic typography scale (H1, H2, Body, Caption, etc.).
  Make it aesthetically pleasing and accessible.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: designSystemSchema,
        temperature: 0.5,
      },
    });

    const text = cleanJson(response.text || "");
    if (!text || text === "{}") throw new Error("AI returned empty response");
    return JSON.parse(text) as DesignSystemData;
  } catch (error) {
    console.error("Gemini API Error (DesignSystem):", error);
    throw new Error("无法生成设计规范，请稍后重试");
  }
};
