import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Welcome, {user?.firstName || "User"}!
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/resume-analyzer"
            className="p-6 bg-white shadow rounded-lg hover:bg-blue-50 transition"
          >
            Resume Analyzer
          </Link>

          <Link
            to="/resume-results"
            className="p-6 bg-white shadow rounded-lg hover:bg-blue-50 transition"
          >
            Resume Results
          </Link>

          <Link
            to="/interview-setup"
            className="p-6 bg-white shadow rounded-lg hover:bg-blue-50 transition"
          >
            Interview Setup
          </Link>

          <Link
            to="/interview-session"
            className="p-6 bg-white shadow rounded-lg hover:bg-blue-50 transition"
          >
            Interview Session
          </Link>

          <Link
            to="/interview-feedback"
            className="p-6 bg-white shadow rounded-lg hover:bg-blue-50 transition"
          >
            Interview Feedback
          </Link>
        </div>
      </div>
    </div>
  );
}
