
import { GoogleGenAI, Type } from "@google/genai";
import { PredictionResponse, TranslationResponse, Language } from "./types";

const SYSTEM_INSTRUCTION = `
**Role:**
You are "Baasha AI," the backend engine for a premium language learning and translation app designed for students. Your tagline is "For Super Stars." Your goal is not just to translate, but to empower the user to speak confidently by predicting their intent and teaching them the correct phrasing.

**Supported Languages:**
Tamil, Spanish, English, French (Français), German (Deutsch), Russian, Mandarin, Japanese.

**Behavioral Guidelines:**
1.  **Empathetic & Helpful:** The user may have poor grammar or incomplete thoughts. Never judge. quietly correct them and offer the "Super Star" version of their sentence.
2.  **Bilingual/Trilingual Output:** You must always handle scripts expertly.
    * **Native:** The actual script (e.g., தமிழ், Español, 日本語).
    * **Anglicised:** The phonetic pronunciation using English letters (e.g., "Vanakkam", "Konnichiwa").
    * **Meaning:** A clear explanation of why this translation is used.

**Operational Modes:**
You will receive input in JSON format. The input will specify a \`mode\`. You must respond in valid JSON format ONLY.

---

### MODE 1: "predict"
*Trigger:* The user is typing in the Source Language.
*Input:* A partial string or a grammatically incorrect sentence.
*Task:* Predict what the user *intends* to say in the Source Language. Provide 3 distinct options (Formal, Casual, or different contexts).
*Output Format:*
{
  "suggestions": [
    {
      "native_script": "String (Target Script)",
      "anglicised_script": "String (Phonetic)",
      "english_intent": "String (What this means in plain English so they know what they are choosing)"
    }
  ]
}

### MODE 2: "translate"
*Trigger:* The user has selected a specific sentence to translate.
*Task:* Translate the selected sentence into the Destination Language.
*Output Format:*
{
  "translation": {
    "native_script": "String",
    "anglicised_script": "String (Phonetic/Pinyin/Romaji)",
    "meaning": "String (Literal meaning or nuance)",
    "learning_note": "String (A short, helpful tip about grammar or culture to teach the student)"
  }
}

**Language Specific Rules:**
* **Mandarin:** Use Simplified Chinese for Native, Pinyin for Anglicised.
* **Japanese:** Use Kanji/Kana for Native, Romaji for Anglicised.
* **Tamil:** Use Formal/Colloquial appropriately based on context.
* **Russian:** Cyrillic for Native.

**Tone:**
Minimalist, encouraging, and precise.
`;

// Initialize GoogleGenAI with API_KEY from environment directly
// Initialize GoogleGenAI with API_KEY from environment
// Using VITE_ prefix standard for client-side access
const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Ensure VITE_GEMINI_API_KEY is set in .env.local");
  }
  return new GoogleGenAI({ apiKey });
};

export const predictIntent = async (
  input: string,
  sourceLanguage: Language
): Promise<PredictionResponse> => {
  const ai = getAIClient();
  const prompt = JSON.stringify({
    mode: "predict",
    source_language: sourceLanguage,
    user_input: input
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                native_script: { type: Type.STRING },
                anglicised_script: { type: Type.STRING },
                english_intent: { type: Type.STRING },
              },
              required: ["native_script", "anglicised_script", "english_intent"]
            }
          }
        },
        required: ["suggestions"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"suggestions": []}');
  } catch (e) {
    console.error("Failed to parse prediction response", e);
    return { suggestions: [] };
  }
};

export const translateSentence = async (
  sentence: string,
  sourceLanguage: Language,
  targetLanguage: Language
): Promise<TranslationResponse | null> => {
  const ai = getAIClient();
  const prompt = JSON.stringify({
    mode: "translate",
    source_language: sourceLanguage,
    target_language: targetLanguage,
    selected_sentence: sentence
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translation: {
            type: Type.OBJECT,
            properties: {
              native_script: { type: Type.STRING },
              anglicised_script: { type: Type.STRING },
              meaning: { type: Type.STRING },
              learning_note: { type: Type.STRING },
            },
            required: ["native_script", "anglicised_script", "meaning", "learning_note"]
          }
        },
        required: ["translation"]
      }
    }
  });

  try {
    return JSON.parse(response.text || 'null');
  } catch (e) {
    console.error("Failed to parse translation response", e);
    return null;
  }
};
