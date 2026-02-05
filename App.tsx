
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Language,
  SUPPORTED_LANGUAGES,
  Suggestion,
  TranslationResult
} from './types';
import { predictIntent, translateSentence } from './geminiService';

const App: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<Language>('English');
  const [targetLang, setTargetLang] = useState<Language>('Tamil');
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Use ReturnType<typeof setTimeout> to avoid NodeJS namespace dependency in browser environment
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced prediction call
  useEffect(() => {
    if (inputText.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await predictIntent(inputText, sourceLang);
        setSuggestions(result.suggestions);
      } catch (error) {
        console.error("Prediction failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputText, sourceLang]);

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setInputText(suggestion.native_script);
    setSuggestions([]);
    setIsTranslating(true);
    try {
      const result = await translateSentence(suggestion.native_script, sourceLang, targetLang);
      if (result) {
        setTranslation(result.translation);
      }
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleManualTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    try {
      const result = await translateSentence(inputText, sourceLang, targetLang);
      if (result) {
        setTranslation(result.translation);
      }
    } catch (error) {
      console.error("Manual Translation failed:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const clearApp = () => {
    setInputText('');
    setSuggestions([]);
    setTranslation(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#FFD700] selection:text-black">
      {/* Header */}
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-[#FFD700] to-[#FFB800] bg-clip-text text-transparent inline-block mb-1">
          BAASHA AI
        </h1>
        <p className="text-[#FFD700] text-xs font-semibold tracking-[0.3em] uppercase opacity-80">
          FOR SUPER STARS
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Language Selectors */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <div className="relative group w-full sm:w-48">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 absolute -top-4 left-1">Source</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as Language)}
              className="w-full bg-[#1e1e1e] border-b-2 border-transparent focus:border-[#FFD700] text-white py-3 px-4 rounded-lg appearance-none transition-all cursor-pointer outline-none hover:bg-[#2a2a2a]"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block text-[#FFD700] opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </div>

          <div className="relative group w-full sm:w-48">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 absolute -top-4 left-1">Target</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as Language)}
              className="w-full bg-[#1e1e1e] border-b-2 border-transparent focus:border-[#FFD700] text-white py-3 px-4 rounded-lg appearance-none transition-all cursor-pointer outline-none hover:bg-[#2a2a2a]"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative mb-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type what you want to say..."
            className="w-full h-40 bg-transparent border-2 border-gray-800 focus:border-[#FFD700] rounded-2xl p-6 text-2xl font-light outline-none transition-all resize-none placeholder:text-gray-700"
          />

          <div className="absolute bottom-4 right-4 flex gap-2">
            {inputText && (
              <button
                onClick={clearApp}
                className="p-2 text-gray-500 hover:text-white transition-colors"
                title="Clear"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
              </button>
            )}
            <button
              onClick={handleManualTranslate}
              disabled={isTranslating || !inputText}
              className="bg-[#FFD700] text-black px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#e6c200] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isTranslating ? '...' : 'Translate'}
            </button>
          </div>
        </div>

        {/* Prediction Pills */}
        <div className="flex flex-wrap gap-2 mb-12 min-h-[48px]">
          {isLoading ? (
            <div className="flex gap-2">
              <div className="w-24 h-8 bg-gray-800 animate-pulse rounded-full"></div>
              <div className="w-32 h-8 bg-gray-800 animate-pulse rounded-full"></div>
              <div className="w-20 h-8 bg-gray-800 animate-pulse rounded-full"></div>
            </div>
          ) : (
            suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="group flex flex-col items-start bg-[#1e1e1e] hover:bg-[#FFD700] border border-gray-800 hover:border-transparent rounded-xl px-4 py-2 transition-all duration-300"
              >
                <span className="text-[#FFD700] group-hover:text-black font-medium transition-colors">{suggestion.native_script}</span>
                <span className="text-[10px] text-gray-500 group-hover:text-black uppercase tracking-tighter transition-colors">{suggestion.english_intent}</span>
              </button>
            ))
          )}
        </div>

        {/* Translation Results */}
        {translation && !isTranslating && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#1e1e1e] rounded-3xl p-8 border border-gray-800 shadow-2xl">
              <div className="mb-8">
                <div className="text-[#FFD700] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 opacity-70">The Super Star Version</div>
                <div className="text-5xl font-bold mb-4">{translation.native_script}</div>
                <div className="text-xl text-gray-400 font-light italic">{translation.anglicised_script}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-800">
                <div>
                  <h4 className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-3">Nuance & Meaning</h4>
                  <p className="text-gray-300 leading-relaxed font-light">{translation.meaning}</p>
                </div>
                <div>
                  <h4 className="text-[#FFD700] text-[10px] uppercase tracking-widest font-bold mb-3">Super Star Tip</h4>
                  <div className="bg-[#121212] p-4 rounded-xl border-l-4 border-[#FFD700]">
                    <p className="text-gray-300 leading-relaxed font-light">{translation.learning_note}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isTranslating && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[#FFD700] text-sm uppercase tracking-widest font-bold">Crafting Excellence...</p>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="mt-auto py-8 text-center opacity-30">
        <p className="text-[10px] uppercase tracking-[0.5em]">Powered by Gemini & Super Star Wisdom</p>
      </footer>
    </div>
  );
};

export default App;
