import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-card border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                AI-Powered Interview Practice
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Master Your
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Interview Skills
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl">
              Practice with AI-driven interviews, get real-time feedback on your
              performance, and land your dream job with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/interview-setup">
                <Button size="lg" variant="hero" className="group">
                  Start Interview
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/resume-analyzer">
                <Button size="lg" variant="outline">
                  Analyze Resume
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="relative animate-scale-in">
            <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-3xl rounded-full"></div>
            <img
              src={heroImage}
              alt="AI Interview Illustration"
              className="relative w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
