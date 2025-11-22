import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Headphones, 
  MessageSquare, 
  TrendingUp, 
  Download,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
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

interface InterviewData {
  jobField: string;
  transcript: TranscriptEntry[];
  behavioralMetrics: BehavioralMetrics[];
  duration: number;
  recording: Blob[];
}

const InterviewFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const interviewData = location.state?.interviewData as InterviewData | undefined;

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-4">No Interview Data Found</h2>
          <p className="text-muted-foreground mb-6">
            Please complete an interview session to view feedback.
          </p>
          <Button onClick={() => navigate('/interview-setup')}>
            Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  const { jobField, transcript, behavioralMetrics, duration } = interviewData;

  // Calculate averages
  const avgEyeContact = behavioralMetrics.length > 0
    ? behavioralMetrics.reduce((sum, m) => sum + m.eyeContactScore, 0) / behavioralMetrics.length
    : 0;

  const avgHeadMovement = behavioralMetrics.length > 0
    ? behavioralMetrics.reduce((sum, m) => sum + m.headMovementScore, 0) / behavioralMetrics.length
    : 0;

  const avgSpeakingPace = behavioralMetrics.length > 0
    ? behavioralMetrics.reduce((sum, m) => sum + m.speakingPace, 0) / behavioralMetrics.length
    : 150;

  const avgConfidence = behavioralMetrics.length > 0
    ? behavioralMetrics.reduce((sum, m) => sum + m.confidenceScore, 0) / behavioralMetrics.length
    : 0;

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Analyze transcript for content quality
  const analyzeTranscript = () => {
    const userResponses = transcript.filter(e => e.speaker === 'user');
    const aiQuestions = transcript.filter(e => e.speaker === 'assistant');
    
    const analysis = {
      totalQuestions: aiQuestions.length,
      totalResponses: userResponses.length,
      avgResponseLength: 0,
      responseQuality: 'good',
      usedFillerWords: false,
      providedExamples: false,
      showedEnthusiasm: false,
    };
    
    if (userResponses.length > 0) {
      // Calculate average response length
      const totalWords = userResponses.reduce((sum, r) => sum + r.text.split(' ').length, 0);
      analysis.avgResponseLength = Math.round(totalWords / userResponses.length);
      
      // Check for filler words
      const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'well', 'actually'];
      const allText = userResponses.map(r => r.text.toLowerCase()).join(' ');
      analysis.usedFillerWords = fillerWords.some(word => allText.includes(word));
      
      // Check for examples and specifics
      const exampleIndicators = ['for example', 'for instance', 'specifically', 'such as', 'like when'];
      analysis.providedExamples = exampleIndicators.some(indicator => allText.includes(indicator));
      
      // Check for enthusiasm
      const enthusiasmWords = ['excited', 'passionate', 'love', 'enjoy', 'interested', 'motivated'];
      analysis.showedEnthusiasm = enthusiasmWords.some(word => allText.includes(word));
      
      // Determine response quality
      if (analysis.avgResponseLength < 10) {
        analysis.responseQuality = 'too-short';
      } else if (analysis.avgResponseLength < 20) {
        analysis.responseQuality = 'short';
      } else if (analysis.avgResponseLength > 100) {
        analysis.responseQuality = 'too-long';
      } else {
        analysis.responseQuality = 'good';
      }
    }
    
    return analysis;
  };

  const transcriptAnalysis = analyzeTranscript();

  // Generate dynamic feedback based on actual performance
  const getFeedback = () => {
    const feedback = [];
    
    // Eye contact feedback
    if (avgEyeContact >= 80) {
      feedback.push({ type: 'positive', text: 'Excellent eye contact maintained throughout the interview.' });
    } else if (avgEyeContact >= 60) {
      feedback.push({ type: 'neutral', text: 'Good eye contact, but try to maintain more consistent focus on the camera.' });
    } else {
      feedback.push({ type: 'negative', text: 'Eye contact needs improvement. Practice looking directly at the camera when speaking.' });
    }

    // Speaking pace feedback
    if (avgSpeakingPace >= 120 && avgSpeakingPace <= 180) {
      feedback.push({ type: 'positive', text: 'Speaking pace was appropriate and easy to follow.' });
    } else if (avgSpeakingPace < 120) {
      feedback.push({ type: 'neutral', text: 'Speaking pace was a bit slow. Try to speak more confidently and at a moderate pace.' });
    } else {
      feedback.push({ type: 'neutral', text: 'Speaking pace was a bit fast. Slow down slightly to ensure clarity.' });
    }

    // Confidence feedback
    if (avgConfidence >= 75) {
      feedback.push({ type: 'positive', text: 'You demonstrated strong confidence and presence.' });
    } else if (avgConfidence >= 60) {
      feedback.push({ type: 'neutral', text: 'Good confidence level. Continue practicing to build more presence.' });
    } else {
      feedback.push({ type: 'negative', text: 'Work on building confidence. Practice your answers and maintain good posture.' });
    }

    // Response quality feedback based on transcript
    if (transcriptAnalysis.responseQuality === 'too-short') {
      feedback.push({ type: 'negative', text: `Your answers were quite brief (avg ${transcriptAnalysis.avgResponseLength} words). Provide more detail and examples to demonstrate your experience.` });
    } else if (transcriptAnalysis.responseQuality === 'short') {
      feedback.push({ type: 'neutral', text: `Your answers were concise (avg ${transcriptAnalysis.avgResponseLength} words). Consider adding more context and specific examples.` });
    } else if (transcriptAnalysis.responseQuality === 'too-long') {
      feedback.push({ type: 'neutral', text: `Your answers were quite detailed (avg ${transcriptAnalysis.avgResponseLength} words). While thorough, try to be more concise while still providing key examples.` });
    } else {
      feedback.push({ type: 'positive', text: `Your answers were well-balanced in length (avg ${transcriptAnalysis.avgResponseLength} words), providing good detail without being too lengthy.` });
    }

    // Filler words feedback
    if (transcriptAnalysis.usedFillerWords) {
      feedback.push({ type: 'neutral', text: 'You used some filler words (um, uh, like). Practice pausing instead of using fillers to sound more professional.' });
    } else {
      feedback.push({ type: 'positive', text: 'You avoided filler words and spoke clearly throughout the interview.' });
    }

    // Examples feedback
    if (transcriptAnalysis.providedExamples) {
      feedback.push({ type: 'positive', text: 'You provided specific examples in your answers, which helps demonstrate your experience effectively.' });
    } else {
      feedback.push({ type: 'neutral', text: 'Try to include more specific examples and concrete achievements in your answers to make them more compelling.' });
    }

    // Enthusiasm feedback
    if (transcriptAnalysis.showedEnthusiasm) {
      feedback.push({ type: 'positive', text: 'You showed enthusiasm and passion in your responses, which is great for interviews.' });
    } else {
      feedback.push({ type: 'neutral', text: 'Consider showing more enthusiasm and passion when discussing your work and interests.' });
    }

    // Head movement feedback
    if (avgHeadMovement >= 80) {
      feedback.push({ type: 'positive', text: 'Head movement was minimal and professional.' });
    } else {
      feedback.push({ type: 'neutral', text: 'Try to minimize excessive head movement for a more professional appearance.' });
    }

    // Interview completion feedback
    if (transcriptAnalysis.totalQuestions >= 5) {
      feedback.push({ type: 'positive', text: `You completed ${transcriptAnalysis.totalQuestions} questions, showing good engagement throughout the interview.` });
    } else if (transcriptAnalysis.totalQuestions >= 3) {
      feedback.push({ type: 'neutral', text: `You answered ${transcriptAnalysis.totalQuestions} questions. Consider practicing longer interview sessions.` });
    } else {
      feedback.push({ type: 'neutral', text: `You answered ${transcriptAnalysis.totalQuestions} question(s). Practice longer sessions to build endurance.` });
    }

    return feedback;
  };

  const feedback = getFeedback();

  // Download transcript
  const downloadTranscript = () => {
    const transcriptText = transcript.map(entry => {
      const time = formatDuration(entry.timestamp);
      const speaker = entry.speaker === 'assistant' ? 'AI Interviewer' : 'You';
      return `[${time}] ${speaker}: ${entry.text}`;
    }).join('\n\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${jobField}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Interview Feedback</h1>
              <p className="text-muted-foreground">
                {jobField} • Duration: {formatDuration(duration)}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/interview-setup')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overall Score */}
              <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
                    <p className="text-muted-foreground">
                      Based on behavioral analysis and interview quality
                    </p>
                  </div>
                  <div className="text-5xl font-extrabold text-primary">
                    {Math.round((avgEyeContact + avgConfidence + avgHeadMovement) / 3)}%
                  </div>
                </div>
              </Card>

              {/* Behavioral Metrics */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Behavioral Analysis
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        <span className="font-medium">Eye Contact</span>
                      </div>
                      <span className="font-bold">{Math.round(avgEyeContact)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${avgEyeContact >= 80 ? 'bg-green-500' : avgEyeContact >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${avgEyeContact}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-primary" />
                        <span className="font-medium">Confidence</span>
                      </div>
                      <span className="font-bold">{Math.round(avgConfidence)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${avgConfidence >= 75 ? 'bg-green-500' : avgConfidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${avgConfidence}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Head Movement</span>
                      <span className="font-bold">{Math.round(avgHeadMovement)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${avgHeadMovement >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${avgHeadMovement}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Speaking Pace</span>
                      <span className="font-bold">{Math.round(avgSpeakingPace)} WPM</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${avgSpeakingPace >= 120 && avgSpeakingPace <= 180 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(100, (avgSpeakingPace / 200) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ideal: 120-180 words per minute
                    </p>
                  </div>
                </div>
              </Card>

              {/* Feedback */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Detailed Feedback</h2>
                <div className="space-y-3">
                  {feedback.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        item.type === 'positive' 
                          ? 'bg-green-50 border-green-500' 
                          : item.type === 'negative'
                          ? 'bg-red-50 border-red-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {item.type === 'positive' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        )}
                        <p className="flex-1">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Transcript */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Full Transcript
                  </h2>
                  <Button size="sm" variant="outline" onClick={downloadTranscript}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {transcript.map((entry, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${
                          entry.speaker === 'assistant' ? 'text-primary' : 'text-foreground'
                        }`}>
                          {entry.speaker === 'assistant' ? 'AI Interviewer' : 'You'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-muted-foreground ml-4">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Questions</span>
                    <span className="font-bold">
                      {transcript.filter(e => e.speaker === 'assistant').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Responses</span>
                    <span className="font-bold">
                      {transcript.filter(e => e.speaker === 'user').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Points</span>
                    <span className="font-bold">{behavioralMetrics.length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewFeedback;

