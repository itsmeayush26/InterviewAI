import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const ResumeAnalyzer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (selectedFile.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      setResults(null);
      toast({
        title: "File uploaded",
        description: `${selectedFile.name} is ready to analyze`,
      });
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a resume first",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resume-analyzer`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze resume');
      }

      const analysis = await response.json();
      
      // Map AI response to match the expected format
      setResults({
        overallScore: analysis.overallScore,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        keywordAnalysis: {
          found: analysis.keywordAnalysis.present,
          missing: analysis.keywordAnalysis.missing,
        },
        atsScore: analysis.atsScore,
      });
      
      toast({
        title: "Analysis complete!",
        description: "Your resume has been analyzed by AI successfully",
      });
    } catch (error) {
      console.error('Resume analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl font-bold">
              Resume{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Analyzer
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Upload your resume for future AI-powered analysis
            </p>
          </div>

          <div className="space-y-8 animate-scale-in">
            {/* Upload Card */}
            <Card className="p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Upload Your Resume</h3>
                  <p className="text-muted-foreground mb-4">
                    Support for PDF and DOCX formats (Max 10MB)
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <label htmlFor="resume-upload">
                      <Button variant="hero" asChild>
                        <span className="cursor-pointer">
                          <FileText className="w-4 h-4" />
                          Choose File
                        </span>
                      </Button>
                    </label>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file && (
                      <span className="text-sm text-muted-foreground">
                        Selected: {file.name}
                      </span>
                    )}
                  </div>
                  {file && (
                    <div className="flex justify-center">
                      <Button 
                        variant="hero" 
                        size="lg"
                        onClick={() => {
                          toast({
                            title: "Coming Soon",
                            description: "Resume analysis feature will be available soon!",
                          });
                        }}
                      >
                        Analyze Resume
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-card border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">What We Analyze</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Keyword optimization</li>
                      <li>• Formatting and structure</li>
                      <li>• Skills alignment</li>
                      <li>• Experience relevance</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-card border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">You'll Receive</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Overall quality score</li>
                      <li>• Improvement suggestions</li>
                      <li>• Industry-specific tips</li>
                      <li>• ATS compatibility check</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            {/* Analysis Results */}
            {results && (
              <div className="space-y-6 animate-fade-in">
                {/* Overall Score */}
                <Card className="p-8 bg-gradient-card border border-border">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-4">Overall Score</h3>
                    <div className="text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                      {results.overallScore}/100
                    </div>
                    <p className="text-muted-foreground">Your resume is performing well!</p>
                  </div>
                </Card>

                {/* Strengths and Improvements */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 border-2 border-green-500/30 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-bold">Strengths</h3>
                    </div>
                    <ul className="space-y-3">
                      {results.strengths.map((strength: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6 border-2 border-yellow-500/30 bg-yellow-500/5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-xl font-bold">Areas for Improvement</h3>
                    </div>
                    <ul className="space-y-3">
                      {results.improvements.map((improvement: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-600 mt-0.5">→</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Keyword Analysis */}
                <Card className="p-6 bg-card border border-border">
                  <h3 className="text-xl font-bold mb-4">Keyword Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-600">Found Keywords</h4>
                        <span className="text-sm text-muted-foreground">
                          {results.keywordAnalysis.found.length} keywords
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {results.keywordAnalysis.found.map((keyword: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-sm font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-yellow-600">Suggested Keywords</h4>
                        <span className="text-sm text-muted-foreground">
                          Consider adding these
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {results.keywordAnalysis.missing.map((keyword: string, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-yellow-500/10 text-yellow-700 rounded-full text-sm font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* ATS Compatibility */}
                <Card className="p-6 bg-gradient-card border border-border">
                  <h3 className="text-xl font-bold mb-4">ATS Compatibility Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">{results.atsScore}%</div>
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-hero transition-all duration-500"
                          style={{ width: `${results.atsScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your resume is {results.atsScore >= 80 ? 'highly' : 'moderately'} compatible with Applicant Tracking Systems
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Tips Section */}
            {!results && (
              <Card className="p-8 bg-card border border-border">
                <h3 className="text-xl font-bold mb-4">Tips for Best Results</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span>
                      Use a clean, professional format without excessive graphics or colors
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span>
                      Include relevant keywords from your target job description
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span>Quantify your achievements with specific metrics and results</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-1">•</span>
                    <span>
                      Keep it concise - ideally one to two pages for most positions
                    </span>
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 InterviewAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ResumeAnalyzer;
