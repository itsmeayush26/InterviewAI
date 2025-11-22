import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import { FileCheck, Video, BarChart3, Brain, Contact } from "lucide-react";
import resumeIcon from "@/assets/resume-icon.png";
import interviewIcon from "@/assets/interview-icon.png";
import About from "./About";
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold">
              Everything You Need to{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Ace Your Interview
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive tools to help you prepare,
              practice, and perform at your best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-in">
            <FeatureCard
              icon={FileCheck}
              image={resumeIcon}
              title="Resume Analysis"
              description="Get detailed feedback on your resume with AI-powered insights and optimization suggestions."
            />
            <FeatureCard
              icon={Video}
              image={interviewIcon}
              title="Live Interview"
              description="Practice with realistic AI interviews featuring real-time audio and video interactions."
            />
            <FeatureCard
              icon={BarChart3}
              title="Performance Metrics"
              description="Track your speaking speed, eye contact, clarity, and get comprehensive performance scores."
            />
            <FeatureCard
              icon={Brain}
              title="Smart Feedback"
              description="Receive personalized recommendations to improve your interview skills based on AI analysis."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold">
              How It <span className="bg-gradient-hero bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Choose Your Role",
                description: "Select the job position you're preparing for from our extensive list.",
              },
              {
                step: "02",
                title: "Start Interview",
                description: "Engage with our AI interviewer through real-time audio and video.",
              },
              {
                step: "03",
                title: "Get Feedback",
                description: "Receive detailed analysis and actionable insights to improve.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative text-center space-y-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center text-3xl font-bold text-white mx-auto shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 InterviewAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
