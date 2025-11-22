import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCamera } from '@/hooks/useCamera';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { AIInterviewer } from '@/utils/aiInterviewer';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Square, 
  Loader2,
  Eye,
  Headphones,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';

interface BehavioralMetrics {
  eyeContactScore: number;
  headMovementScore: number;
  speakingPace: number;
  confidenceScore: number;
  timestamp: number;
}

interface TranscriptEntry {
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const InterviewSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const jobField = searchParams.get('field') || 'Software Engineer';
  
  // Interview state
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [behavioralMetrics, setBehavioralMetrics] = useState<BehavioralMetrics[]>([]);
  
  // Refs
  const aiInterviewerRef = useRef<AIInterviewer | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const analysisIntervalRef = useRef<number | null>(null);
  const interviewStartTimeRef = useRef<number>(0);
  
  // Camera hook
  const {
    videoRef,
    canvasRef,
    isActive: isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    analyzeEyeContact,
  } = useCamera();

  // Voice assistant hook - initialize with placeholder, will be updated
  const voiceAssistantRef = useRef<{
    isListening: boolean;
    isSpeaking: boolean;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string) => void;
    stopSpeaking: () => void;
  } | null>(null);

  // Define handleAIResponse first (will use voice assistant from ref)
  // Note: isListening will be available via voiceAssistantRef
  const handleAIResponse = useCallback(async (userResponse: string) => {
    if (!aiInterviewerRef.current) {
      console.error('❌ AI Interviewer not initialized');
      return;
    }

    try {
      console.log('🤖 Processing user response and getting next question...');
      
      // Stop listening while AI processes and speaks
      voiceAssistantRef.current?.stopListening();
      
      const question = await aiInterviewerRef.current.getNextQuestion(userResponse);
      console.log('✅ Got AI question:', question);
      
      setCurrentQuestion(question);
      
      // Add AI question to transcript
      setTranscript(prev => [...prev, {
        speaker: 'assistant',
        text: question,
        timestamp: Date.now() - interviewStartTimeRef.current,
      }]);

      // Speak the question
      console.log('🗣️ Speaking AI question...');
      voiceAssistantRef.current?.speak(question);
      
      // After AI finishes speaking, start listening for user response
      // This is handled in the speak function's onend callback
      isWaitingForResponseRef.current = true;
      
      // Backup: Start listening after delay (in case TTS callback doesn't fire)
      setTimeout(() => {
        const isCurrentlyListening = voiceAssistantRef.current?.isListening || false;
        if (isWaitingForResponseRef.current && !isCurrentlyListening && isInterviewActive) {
          console.log('🔄 Backup: Starting to listen after AI question...');
          voiceAssistantRef.current?.startListening();
        }
      }, 4000);
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
      // Resume listening even on error
      setTimeout(() => {
        console.log('🔄 Resuming listening after error...');
        voiceAssistantRef.current?.startListening();
        isWaitingForResponseRef.current = true;
      }, 2000);
    }
  }, [toast, isInterviewActive]);

  // Track if we're waiting for user response
  const isWaitingForResponseRef = useRef(false);
  const lastUserResponseRef = useRef<string>('');

  // Handle user transcript - only process when user finishes speaking
  // This must be defined before useVoiceAssistant
  const handleUserTranscript = useCallback((text: string) => {
    console.log('🎤 handleUserTranscript called:', { text, isInterviewActive, trimmed: text.trim() });
    
    if (!text.trim()) {
      console.log('⚠️ Empty transcript, ignoring');
      return;
    }
    
    if (!isInterviewActive) {
      console.log('⚠️ Interview not active, ignoring transcript');
      return;
    }
    
    // Prevent duplicate processing of the same response
    if (lastUserResponseRef.current === text.trim()) {
      console.log('⚠️ Duplicate transcript ignored:', text);
      return;
    }
    
    lastUserResponseRef.current = text.trim();
    isWaitingForResponseRef.current = false;
    
    console.log('✅ Processing user response:', text);
    
    // Add to transcript
    setTranscript(prev => {
      const newEntry = {
        speaker: 'user' as const,
        text: text.trim(),
        timestamp: Date.now() - interviewStartTimeRef.current,
      };
      console.log('📝 Adding to transcript:', newEntry);
      return [...prev, newEntry];
    });

    // Get AI response (this will ask the next question)
    console.log('🤖 Getting AI response for:', text);
    handleAIResponse(text);
  }, [isInterviewActive, handleAIResponse]);

  // Initialize voice assistant with the transcript handler
  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant({
    onTranscript: handleUserTranscript,
    onSpeechStart: () => {
      console.log('🎤 Speech recognition started - ready to listen');
    },
    onSpeechEnd: () => {
      console.log('🎤 Speech recognition ended');
    },
  });


  // Update ref with voice assistant functions
  useEffect(() => {
    voiceAssistantRef.current = {
      isListening,
      isSpeaking,
      startListening,
      stopListening,
      speak,
      stopSpeaking,
    };
  }, [isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking]);

  // Calculate head movement based on actual face detection
  const calculateHeadMovement = useCallback(() => {
    // Get head movement from eye contact analysis
    const eyeContactResult = analyzeEyeContact();
    const headMovement = (eyeContactResult as any).headMovement || 0;
    
    // Convert movement to score (less movement = higher score)
    // Normalize movement (typical range: 0-50 pixels)
    const normalizedMovement = Math.min(1, headMovement / 50);
    const score = Math.max(60, 100 - (normalizedMovement * 40));
    
    return Math.floor(score);
  }, [analyzeEyeContact]);

  const calculateSpeakingPace = useCallback(() => {
    // Calculate words per minute from transcript
    const recentEntries = transcript.slice(-5);
    if (recentEntries.length === 0) return 150; // Default WPM
    
    const userEntries = recentEntries.filter(e => e.speaker === 'user');
    if (userEntries.length === 0) return 150;
    
    const totalWords = userEntries.reduce((sum, e) => sum + e.text.split(' ').length, 0);
    const timeSpan = userEntries.length * 5; // Approximate 5 seconds per entry
    return Math.floor((totalWords / timeSpan) * 60);
  }, [transcript]);

  const calculateConfidenceScore = useCallback(() => {
    // Combine multiple factors
    const avgEyeContact = behavioralMetrics.length > 0
      ? behavioralMetrics.reduce((sum, m) => sum + m.eyeContactScore, 0) / behavioralMetrics.length
      : 70;
    
    const speakingPace = calculateSpeakingPace();
    const paceScore = speakingPace >= 120 && speakingPace <= 180 ? 90 : 70;
    
    return Math.floor((avgEyeContact + paceScore) / 2);
  }, [behavioralMetrics, calculateSpeakingPace]);

  // Behavioral analysis - must be defined before startInterview
  const startBehavioralAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    
    // Analyze more frequently for better tracking
    analysisIntervalRef.current = window.setInterval(() => {
      if (!isInterviewActive) return;

      const eyeContact = analyzeEyeContact();
      const headMovementScore = calculateHeadMovement();
      
      const metrics: BehavioralMetrics = {
        eyeContactScore: eyeContact.score,
        headMovementScore: headMovementScore,
        speakingPace: calculateSpeakingPace(),
        confidenceScore: calculateConfidenceScore(),
        timestamp: Date.now() - interviewStartTimeRef.current,
      };

      console.log('Behavioral metrics:', metrics);
      setBehavioralMetrics(prev => [...prev, metrics]);
    }, 3000); // Analyze every 3 seconds for more responsive tracking
  }, [isInterviewActive, analyzeEyeContact, calculateHeadMovement, calculateSpeakingPace, calculateConfidenceScore]);

  // Start interview - defined after all dependencies
  const startInterview = useCallback(async () => {
    try {
      // Start camera first - this will get the stream
      const stream = await startCamera();
      
      if (!stream) {
        throw new Error('Failed to get camera stream');
      }

      console.log('Camera stream obtained:', {
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoTrackState: stream.getVideoTracks()[0]?.readyState,
        audioTrackState: stream.getAudioTracks()[0]?.readyState,
      });

      // Initialize AI Interviewer
      aiInterviewerRef.current = new AIInterviewer(jobField);

      // IMPORTANT: Clone the stream for MediaRecorder to avoid conflicts
      // This prevents MediaRecorder from interfering with the video element
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (!videoTrack || !audioTrack) {
        throw new Error('Missing video or audio tracks');
      }

      // Create a new stream with cloned tracks for recording
      const recordingStream = new MediaStream();
      recordingStream.addTrack(videoTrack);
      recordingStream.addTrack(audioTrack);

      console.log('Recording stream created:', {
        active: recordingStream.active,
        tracks: recordingStream.getTracks().length,
      });

      // Start recording using the cloned stream
      recordedChunksRef.current = [];
      
      // Try different MIME types for better browser compatibility
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      
      const mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: mimeType,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        // Store recording (you can upload to server or save locally)
        console.log('Recording stopped, size:', blob.size);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording with timeslice to ensure data is collected regularly
      try {
        mediaRecorder.start(1000); // Collect data every second
        setIsRecording(true);
      } catch (recError) {
        console.error('Error starting MediaRecorder:', recError);
        // Continue even if recording fails
      }

      // Start behavioral analysis
      startBehavioralAnalysis();

      // Initialize interview
      setIsInterviewActive(true);
      interviewStartTimeRef.current = Date.now();

      // Get first question
      const firstQuestion = await aiInterviewerRef.current.getNextQuestion();
      setCurrentQuestion(firstQuestion);
      
      // Add first question to transcript
      setTranscript(prev => [...prev, {
        speaker: 'assistant',
        text: firstQuestion,
        timestamp: Date.now() - interviewStartTimeRef.current,
      }]);
      
      // Speak the first question
      console.log('🗣️ Speaking first question:', firstQuestion);
      speak(firstQuestion);
      
      // Mark that we're waiting for user response
      // Listening will start automatically after AI finishes speaking
      isWaitingForResponseRef.current = true;
      
      // Backup: Start listening after delay (in case TTS callback doesn't fire)
      setTimeout(() => {
        if (isWaitingForResponseRef.current && !isListening && isInterviewActive) {
          console.log('🔄 Backup: Starting to listen for user response...');
          startListening();
        }
      }, 3000);
      
      // Also start listening after a delay as backup (in case TTS callback doesn't fire)
      setTimeout(() => {
        if (isWaitingForResponseRef.current && !isListening && isInterviewActive) {
          console.log('🔄 Backup: Starting to listen for user response...');
          startListening();
        }
      }, 3000);

      toast({
        title: 'Interview Started',
        description: 'Your interview session has begun. Good luck!',
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to start interview. Please check camera and microphone permissions.',
        variant: 'destructive',
      });
      // Don't stop camera on error - let user retry without re-requesting permissions
      console.error('Interview start error, camera may still be active');
    }
  }, [jobField, startCamera, stopCamera, speak, startListening, startBehavioralAnalysis, toast]);



  // End interview
  const endInterview = useCallback(() => {
    setIsInterviewActive(false);
    stopListening();
    stopSpeaking();

    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      } catch (err) {
        console.warn('Error stopping recorder:', err);
      }
    }

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    // Stop camera last (after recorder is stopped)
    stopCamera();

    // Navigate to feedback page with data
    const interviewData = {
      jobField,
      transcript,
      behavioralMetrics,
      duration: Date.now() - interviewStartTimeRef.current,
      recording: recordedChunksRef.current,
    };

    navigate('/interview-feedback', { 
      state: { interviewData } 
    });
  }, [stopListening, stopSpeaking, stopCamera, isRecording, jobField, transcript, behavioralMetrics, navigate]);

  // Keep video playing - prevent pause
  useEffect(() => {
    if (isInterviewActive && videoRef.current) {
      const video = videoRef.current;
      
      const handlePause = () => {
        if (isInterviewActive && video.paused) {
          console.log('Video paused, resuming...');
          video.play().catch(err => {
            console.warn('Failed to resume video:', err);
          });
        }
      };
      
      const handleStalled = () => {
        console.log('Video stalled, attempting to resume...');
        if (isInterviewActive) {
          video.load();
          video.play().catch(err => {
            console.warn('Failed to resume after stall:', err);
          });
        }
      };
      
      video.addEventListener('pause', handlePause);
      video.addEventListener('stalled', handleStalled);
      
      // Ensure video is playing
      if (video.paused) {
        video.play().catch(err => console.warn('Initial play in effect failed:', err));
      }
      
      return () => {
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('stalled', handleStalled);
      };
    }
  }, [isInterviewActive, videoRef]);

  // Cleanup - only on unmount, not on every render
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up...');
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      // Only stop if interview is actually active
      if (isInterviewActive) {
        stopCamera();
        stopListening();
        stopSpeaking();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on unmount

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Interview Session: {jobField}</h1>
            <p className="text-muted-foreground">
              {isInterviewActive ? 'Interview in progress...' : 'Ready to start'}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Feed */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-4 bg-black rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-gray-900 rounded-lg">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: '#000' }}
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.play().catch(err => {
                        console.warn('Video play error:', err);
                      });
                    }}
                    onPlay={() => {
                      console.log('Video is playing');
                    }}
                    onPause={() => {
                      console.warn('Video paused, attempting to resume');
                      if (videoRef.current && isInterviewActive) {
                        videoRef.current.play().catch(err => {
                          console.warn('Resume failed:', err);
                        });
                      }
                    }}
                  />
                  <canvas 
                    ref={canvasRef} 
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                  
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Camera not active</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  {!isInterviewActive ? (
                    <Button onClick={startInterview} size="lg" className="min-w-[200px]">
                      <Video className="w-5 h-5 mr-2" />
                      Start Interview
                    </Button>
                  ) : (
                    <Button onClick={endInterview} size="lg" variant="destructive" className="min-w-[200px]">
                      <Square className="w-5 h-5 mr-2" />
                      End Interview
                    </Button>
                  )}
                </div>
              </Card>

              {/* Current Question */}
              {currentQuestion && (
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-6 h-6 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">Current Question</h3>
                      <p className="text-muted-foreground">{currentQuestion}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Status Indicators */}
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isCameraActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <p className="text-xs text-muted-foreground">Camera</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                      isListening ? 'bg-green-500 animate-pulse' : 
                      isSpeaking ? 'bg-yellow-500' : 
                      'bg-gray-400'
                    }`} />
                    <p className="text-xs text-muted-foreground">
                      {isSpeaking ? 'AI Speaking' : isListening ? '🎤 Listening...' : 'Idle'}
                    </p>
                    {isListening && (
                      <p className="text-xs text-green-600 mt-1 font-medium">Speak now!</p>
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                    <p className="text-xs text-muted-foreground">Recording</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Live Metrics */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Live Metrics</h3>
                <div className="space-y-3">
                  {behavioralMetrics.length > 0 && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Eye Contact</span>
                          <span className="font-medium">
                            {Math.round(behavioralMetrics[behavioralMetrics.length - 1].eyeContactScore)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${behavioralMetrics[behavioralMetrics.length - 1].eyeContactScore}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Confidence</span>
                          <span className="font-medium">
                            {Math.round(calculateConfidenceScore())}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${calculateConfidenceScore()}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Transcript Preview */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Transcript</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transcript yet...</p>
                  ) : (
                    transcript.slice(-5).map((entry, idx) => (
                      <div key={idx} className="text-sm">
                        <span className={`font-medium ${entry.speaker === 'assistant' ? 'text-primary' : 'text-foreground'}`}>
                          {entry.speaker === 'assistant' ? 'AI' : 'You'}:
                        </span>
                        <span className="ml-2 text-muted-foreground">{entry.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>

          {cameraError && (
            <Card className="p-4 mt-4 border-red-500 bg-red-50">
              <p className="text-red-700">{cameraError}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;

