
export type AppMode = 'predict' | 'translate';

export interface Suggestion {
  native_script: string;
  anglicised_script: string;
  english_intent: string;
}

export interface TranslationResult {
  native_script: string;
  anglicised_script: string;
  meaning: string;
  learning_note: string;
}

export interface PredictionResponse {
  suggestions: Suggestion[];
}

export interface TranslationResponse {
  translation: TranslationResult;
}

export const SUPPORTED_LANGUAGES = [
  "English",
  "Tamil",
  "Spanish",
  "French",
  "German",
  "Russian",
  "Mandarin",
  "Japanese"
] as const;

export type Language = typeof SUPPORTED_LANGUAGES[number];
