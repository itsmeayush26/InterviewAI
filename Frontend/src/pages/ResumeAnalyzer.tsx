// src/pages/ResumeAnalyzer.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button"; // Assuming your UI library component
import { Upload, FileText, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResumeAnalysisResult } from "@/types/analysis"; // Import the interface

const API_URL = 'http://127.0.0.1:5000/api/analyze-resume'; 

const ResumeAnalyzer = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            // Check file type (optional client-side validation)
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension === 'pdf' || extension === 'docx') {
                setSelectedFile(file);
                setError(null);
            } else {
                setSelectedFile(null);
                setError("Unsupported file type. Please upload PDF or DOCX.");
            }
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError("Please select a file to analyze.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            // CRITICAL: The key MUST be 'resumeFile' to match your Flask backend
            formData.append('resumeFile', selectedFile); 

            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // Success: Navigate to the results page and pass the data via state
                const results: ResumeAnalysisResult = data;
                navigate('/resume-results', { state: { results } });
            } else {
                // Handle API error messages from the server
                setError(data.error || "An unknown error occurred during analysis.");
            }
        } catch (err) {
            console.error("Network or Fetch Error:", err);
            setError("Could not connect to the analysis server. Please ensure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-16 px-4">
            <h1 className="text-4xl font-bold mb-10 text-center">Analyze Your Resume</h1>
            
            <div className="max-w-3xl mx-auto p-10 border rounded-xl shadow-lg border-dashed border-gray-300">
                <div className="flex flex-col items-center space-y-4">
                    <Upload className="w-12 h-12 text-primary" />
                    <p className="text-xl font-semibold">Upload Your Resume</p>
                    <p className="text-sm text-muted-foreground">Support for PDF and DOCX formats (Max 10MB)</p>
                    
                    {/* Hidden actual file input */}
                    <input 
                        id="file-upload"
                        type="file" 
                        accept=".pdf,.docx"
                        onChange={handleFileChange} 
                        className="hidden"
                    />
                    
                    {/* Custom Choose File button */}
                    <label 
                        htmlFor="file-upload" 
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 py-2 px-4 cursor-pointer bg-primary/10 text-primary hover:bg-primary/20"
                    >
                        Choose File
                    </label>

                    {selectedFile && (
                        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <FileText className="w-4 h-4" /> 
                            Selected: **{selectedFile.name}**
                        </p>
                    )}
                </div>

                <div className="mt-8 flex justify-center">
                    <Button 
                        size="lg"
                        onClick={handleAnalyze}
                        disabled={!selectedFile || isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? (
                            <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</span>
                        ) : (
                            <span className="flex items-center">Analyze Resume <ArrowRight className="ml-2 h-4 w-4" /></span>
                        )}
                    </Button>
                </div>

                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>

            {/* What We Analyze / You'll Receive Sections (from your screenshot) */}
            <div className="grid sm:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
                {/* ... (Include your "What We Analyze" and "You'll Receive" JSX here) */}
            </div>
        </div>
    );
};

export default ResumeAnalyzer;