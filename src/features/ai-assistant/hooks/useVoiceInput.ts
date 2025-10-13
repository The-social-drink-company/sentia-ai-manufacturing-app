import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

export interface UseVoiceInputOptions {
  onTranscript: (transcript: string) => void;
}

export function useVoiceInput({ onTranscript }: UseVoiceInputOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const SpeechRecognitionImpl = (window.SpeechRecognition || window.webkitSpeechRecognition) as (new () => SpeechRecognition) | undefined;
    if (!SpeechRecognitionImpl) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [onTranscript]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return useMemo(() => ({
    isSupported,
    isListening,
    error,
    start,
    stop,
  }), [error, isListening, isSupported, start, stop]);
}
