import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  // --- Speech to Text (Browser API) ---
  const startListening = useCallback((lang: string = 'en-US') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, []);

  // --- Text to Speech (Gemini API) ---
  const speak = useCallback(async (text: string, lang: string = 'en') => {
    try {
      setIsSpeaking(true);
      
      // Map lang code to voice hint
      const voiceHint = lang === 'te' ? 'Puck' : lang === 'hi' ? 'Fenrir' : 'Kore';
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say this naturally in ${lang}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceHint },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioSrc = `data:audio/wav;base64,${base64Audio}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    // Basic stop logic for the Audio element would need a ref, 
    // but browser speechSynthesis is easier to stop globally.
    // For now, we'll just handle completion.
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    isSpeaking,
    speak,
    stopSpeaking
  };
}
