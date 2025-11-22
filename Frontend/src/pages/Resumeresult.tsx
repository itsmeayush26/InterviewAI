import React from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Zap, TrendingUp, HelpCircle } from 'lucide-react';
import { ResumeAnalysisResult } from "@/types/analysis"; // Import the interface

const ResumeResults = () => {
    // Retrieve the results data passed from the analyze page
    const location = useLocation();
    const results = location.state?.results as ResumeAnalysisResult | undefined;

    if (!results) {
        return (
            <div className="container mx-auto py-16 text-center">
                <HelpCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-4">No Analysis Data Found</h2>
                <p className="text-muted-foreground">Please return to the analyzer page to upload a resume.</p>
            </div>
        );
    }

    const { atsScore, keywordSuggestions, formattingTips } = results;

    return (
        <div className="container mx-auto py-16 px-4">
            <h1 className="text-4xl font-bold mb-4 text-center">🎯 Your Resume Analysis</h1>
            <p className="text-center text-lg text-muted-foreground mb-12">Actionable feedback to optimize your profile.</p>

            {/* ATS Score Card */}
            <div className="max-w-2xl mx-auto p-8 rounded-xl shadow-2xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 mb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-primary">Compatibility Score</p>
                        <h3 className="text-6xl font-extrabold mt-1" style={{ color: atsScore > 70 ? 'green' : atsScore > 50 ? 'orange' : 'red' }}>
                            {atsScore}%
                        </h3>
                    </div>
                    <Zap className="w-16 h-16 text-primary opacity-50" />
                </div>
                <p className="mt-4 text-muted-foreground">
                    This score estimates how well an automated **Applicant Tracking System (ATS)** would parse and rank your resume for a typical developer role.
                </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
                {/* 1. Keyword Suggestions */}
                <div className="p-6 border rounded-xl shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-red-600">
                        <TrendingUp className="w-6 h-6" /> Improve Keyword Alignment
                    </h2>
                    <p className="text-muted-foreground mb-4">Add these high-value keywords to better align with the job description and boost your score.</p>
                    <ul className="space-y-3">
                        {keywordSuggestions.length > 0 ? (
                            keywordSuggestions.map((kw, index) => (
                                <li key={index} className="flex items-center p-3 bg-red-50/50 border-l-4 border-red-500 rounded">
                                    <span className="font-medium">{kw}</span>
                                </li>
                            ))
                        ) : (
                            <li className="text-green-600 font-medium">Excellent! All core keywords are present.</li>
                        )}
                    </ul>
                </div>

                {/* 2. Formatting Tips */}
                <div className="p-6 border rounded-xl shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-indigo-600">
                        <CheckCircle className="w-6 h-6" /> Structure & Formatting
                    </h2>
                    <p className="text-muted-foreground mb-4">Tips for ensuring your resume is easily read by both humans and robots.</p>
                    <ul className="space-y-3">
                        {formattingTips.map((tip, index) => (
                            <li key={index} className="flex items-start p-3 bg-indigo-50/50 border-l-4 border-indigo-500 rounded">
                                <span className="font-medium">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ResumeResults;