import { GoogleGenAI, Type } from "@google/genai";
import { Language, Message, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async generateExplanation(
    concept: string, 
    language: Language, 
    previousContext: string[] = []
  ): Promise<{ explanation: string; nextConcept: string }> {
    const prompt = `
      You are an expert educational storyteller. 
      Explain the concept of "${concept}" using a highly engaging story, real-life analogy, or relatable scenario.
      
      Requirements:
      1. Explain from basic to advanced levels naturally.
      2. Keep it conversational, like a personal tutor.
      3. Language: ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}.
      4. At the end, naturally suggest what the NEXT logical concept should be to build a chain of learning.
      
      Previous concepts discussed: ${previousContext.join(', ')}. Ensure continuity.
      
      Return as JSON:
      {
        "explanation": "the story/explanation",
        "nextConcept": "the name of the next concept"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            nextConcept: { type: Type.STRING }
          },
          required: ["explanation", "nextConcept"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text || "{}");
      return data;
    } catch (e) {
      console.error("Failed to parse explanation", response.text);
      return { 
        explanation: response.text || "I'm having trouble telling a story right now. Let's try again!", 
        nextConcept: "Something new" 
      };
    }
  },

  async generateQuiz(
    concept: string, 
    explanation: string, 
    language: Language
  ): Promise<QuizQuestion[]> {
    const prompt = `
      Generate a 3-question multiple-choice quiz based on the following educational explanation for "${concept}".
      Explanation: "${explanation}"
      
      Language: ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}.
      
      Return as JSON array of objects:
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": index (0-3),
        "explanation": "Why this is correct"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Failed to parse quiz", response.text);
      return [];
    }
  }
};
