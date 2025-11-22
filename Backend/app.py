from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os

# Import analysis function
from resume_analyzer.nlp_processor import process_resume_file

app = Flask(__name__)
CORS(app)  # Allow frontend (3000) to access backend (5000)

# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------------
# Utility function
# ---------------------------------------------------------

def allowed_file(filename):
    """Check if uploaded file extension is allowed."""
    return (
        '.' in filename
        and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend is running."""
    try:
        # Test if analysis module can be imported
        from resume_analyzer.nlp_processor import process_resume_file
        return jsonify({
            "status": "ok", 
            "message": "Backend is running",
            "analysis_module": "loaded"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Backend running but analysis module error: {str(e)}"
        }), 500

@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume_endpoint():
    """Handles file upload + resume analysis."""
    print("=" * 50)
    print("Resume Analysis Request Received")
    print("=" * 50)
    
    if 'resumeFile' not in request.files:
        print("ERROR: No file part in request")
        return jsonify({"error": "No file part. Use key 'resumeFile'."}), 400

    file = request.files['resumeFile']
    print(f"File received: {file.filename}, Content-Type: {file.content_type}")

    if file.filename == '' or not allowed_file(file.filename):
        print(f"ERROR: Invalid file - filename: '{file.filename}'")
        return jsonify({"error": "Invalid file or unsupported format. Please upload PDF or DOCX files only."}), 400

    # -------------------------
    # 1. Save file locally
    # -------------------------
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    print(f"Saving file to: {filepath}")

    try:
        file.save(filepath)
        file_size = os.path.getsize(filepath)
        print(f"File saved successfully. Size: {file_size} bytes")
    except Exception as e:
        import traceback
        print(f"File save error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": f"Could not save uploaded file: {str(e)}"}), 500

    # -------------------------
    # 2. Process resume
    # -------------------------
    try:
        print("Starting resume analysis...")
        result = process_resume_file(filepath)
        print(f"Analysis complete. ATS Score: {result.get('atsScore', 'N/A')}")
        
        # Validate result structure matches frontend expectations
        if not isinstance(result, dict):
            print("ERROR: Result is not a dictionary")
            return jsonify({"error": "Invalid response format from analyzer."}), 500
        
        # Ensure required fields exist
        required_fields = ["atsScore", "keywordSuggestions", "formattingTips"]
        for field in required_fields:
            if field not in result:
                print(f"WARNING: Missing field '{field}', adding default value")
                result[field] = [] if field != "atsScore" else 0
        
        # Validate data types
        if not isinstance(result.get("atsScore"), (int, float)):
            result["atsScore"] = 0
        if not isinstance(result.get("keywordSuggestions"), list):
            result["keywordSuggestions"] = []
        if not isinstance(result.get("formattingTips"), list):
            result["formattingTips"] = []
        
        print(f"Returning result: Score={result['atsScore']}, Keywords={len(result['keywordSuggestions'])}, Tips={len(result['formattingTips'])}")
        return jsonify(result)

    except Exception as e:
        import traceback
        print("=" * 50)
        print("RESUME PROCESSING ERROR")
        print("=" * 50)
        print(f"Error: {e}")
        print(traceback.format_exc())
        print("=" * 50)
        return jsonify({"error": f"Internal server error while analyzing resume: {str(e)}"}), 500

    finally:
        # -------------------------
        # 3. Always delete temp file
        # -------------------------
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"Temporary file deleted: {filepath}")
        except Exception as e:
            print(f"Warning: Could not delete temp file: {e}")


# ---------------------------------------------------------
# Run Flask Server
# ---------------------------------------------------------

if __name__ == '__main__':
    print("=" * 60)
    print("Starting Resume Analyzer Backend Server")
    print("=" * 60)
    print(f"Server will run on: http://127.0.0.1:5000")
    print(f"Health check: http://127.0.0.1:5000/api/health")
    print(f"Analyze endpoint: http://127.0.0.1:5000/api/analyze-resume")
    print("=" * 60)
    app.run(debug=True, port=5000, host='127.0.0.1')
