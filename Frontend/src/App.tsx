import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  UserButton,
} from "@clerk/clerk-react";

import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeResults from "./pages/Resumeresult";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewSession from "./pages/InterviewSession";
import InterviewFeedback from "./pages/InterviewFeedback";
import NotFound from "./pages/NotFound";

// Clerk auth pages
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

// Dashboard page
import Dashboard from "./pages/Dashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        {/* Navbar with UserButton */}
        <div className="p-4 flex justify-end">
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* CLERK AUTH ROUTES */}
          <Route
            path="/sign-in/*"
            element={<SignInPage path="/sign-in" redirectUrl="/dashboard" />}
          />
          <Route
            path="/sign-up/*"
            element={<SignUpPage path="/sign-up" redirectUrl="/dashboard" />}
          />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <SignedIn>
                <Dashboard />
              </SignedIn>
            }
          />
          <Route
            path="/dashboard"
            element={
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            }
          />

          {/* PROTECTED ROUTES */}
          <Route
            path="/resume-analyzer"
            element={
              <SignedIn>
                <ResumeAnalyzer />
              </SignedIn>
            }
          />
          <Route
            path="/resume-results"
            element={
              <SignedIn>
                <ResumeResults />
              </SignedIn>
            }
          />
          <Route
            path="/interview-setup"
            element={
              <SignedIn>
                <InterviewSetup />
              </SignedIn>
            }
          />
          <Route
            path="/interview-session"
            element={
              <SignedIn>
                <InterviewSession />
              </SignedIn>
            }
          />
          <Route
            path="/interview-feedback"
            element={
              <SignedIn>
                <InterviewFeedback />
              </SignedIn>
            }
          />

          {/* REDIRECT UNAUTHENTICATED USERS */}
          <Route
            path="/resume-analyzer"
            element={
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            }
          />

          {/* CATCH ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
