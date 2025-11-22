import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceAssistantOptions {
  onTranscript: (text: string) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
}

export const useVoiceAssistant = ({
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
}: VoiceAssistantOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  
  // Update ref when callback changes
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return null;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognitionAPI();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      onSpeechStart();
    };

    let finalTranscript = '';
    let interimTranscript = '';

    recognition.onresult = (event: any) => {
      interimTranscript = '';
      finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Only send final transcripts (when user finishes speaking)
      if (finalTranscript.trim()) {
        console.log('🎯 Final transcript received:', finalTranscript.trim());
        console.log('📤 Calling onTranscript callback...');
        try {
          onTranscriptRef.current(finalTranscript.trim());
          console.log('✅ Transcript callback executed successfully');
        } catch (error) {
          console.error('❌ Error in transcript callback:', error);
        }
        finalTranscript = ''; // Clear after processing
      } else if (interimTranscript.trim()) {
        // Log interim results for debugging
        console.log('⏳ Interim transcript:', interimTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Don't restart automatically - wait for user to speak
        console.log('No speech detected, waiting...');
      } else if (event.error === 'aborted') {
        // Recognition was stopped, don't restart
        console.log('Recognition aborted');
      } else {
        // For other errors, try to restart
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Failed to restart recognition:', err);
            }
          }
        }, 1000);
      }
    };

    let shouldRestart = true;
    
    recognition.onend = () => {
      console.log('Speech recognition ended, shouldRestart:', shouldRestart);
      setIsListening(false);
      onSpeechEnd();
      
      // Auto-restart if it ended unexpectedly (but not if we stopped it intentionally)
      if (shouldRestart && recognitionRef.current) {
        console.log('Auto-restarting speech recognition...');
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.error('Auto-restart failed:', err);
            }
          }
        }, 500);
      }
    };
    
    // Store shouldRestart flag in recognition object for access in stopListening
    (recognition as any).shouldRestart = () => shouldRestart;
    (recognition as any).setShouldRestart = (value: boolean) => { shouldRestart = value; };

    return recognition;
  }, [onTranscript, onSpeechStart, onSpeechEnd]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
      if (!recognitionRef.current) {
        console.error('Failed to initialize speech recognition');
        return;
      }
    }

    const recognition = recognitionRef.current as any;
    
    // Mark that we want to restart if it ends
    if (recognition.setShouldRestart) {
      recognition.setShouldRestart(true);
    }

    try {
      // If already listening, don't restart
      if (isListening) {
        console.log('Already listening, skipping start');
        return;
      }
      
      console.log('Starting speech recognition...');
      recognitionRef.current.start();
      
      // Verify it actually started
      setTimeout(() => {
        if (!isListening) {
          console.warn('Recognition may not have started, checking status...');
        }
      }, 500);
    } catch (error: any) {
      console.error('Error starting recognition:', error);
      
      // If error is "already started", that's okay
      if (error.name === 'InvalidStateError' || error.message?.includes('started')) {
        console.log('Recognition already started');
        setIsListening(true);
      } else if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        console.error('Microphone permission denied');
        alert('Microphone permission is required. Please allow microphone access and try again.');
      } else {
        // Try to restart after a delay
        console.log('Retrying recognition start in 1 second...');
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (retryError) {
              console.error('Retry start failed:', retryError);
            }
          }
        }, 1000);
      }
    }
  }, [initRecognition, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Mark that we intentionally stopped, so don't auto-restart
      const recognition = recognitionRef.current as any;
      if (recognition.setShouldRestart) {
        recognition.setShouldRestart(false);
      }
      
      try {
        recognitionRef.current.stop();
        console.log('Stopped listening intentionally');
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, []);

  // Speak text using browser TTS
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
        // Pause listening while AI is speaking
        if (isListening) {
          stopListening();
        }
      };

      utterance.onend = () => {
        console.log('AI speech ended, ready to listen for user response');
        setIsSpeaking(false);
        // Resume listening after AI finishes speaking
        // Wait a bit longer to ensure speech is fully complete
        setTimeout(() => {
          console.log('Starting to listen for user response...');
          startListening();
        }, 1000); // Wait 1 second after AI finishes speaking
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isListening, startListening, stopListening]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};
