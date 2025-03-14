# MindClash
MindClash: Battle of Wits – A fast-paced multiplayer quiz game! Compete in real-time, unlock power-ups, tackle challenges, and climb the leaderboard. Built with Python (Django) & React. Play now and prove you're the Quiz Master!

## Version 2.0 - LLM Integration Updates

This version integrates LLM technology (llamafile) for AI-powered quiz generation. We've enhanced the application with predefined templates for popular topics and improved the user experience.

## Project Structure

- `backend/`: Django backend server
- `frontend/`: React/Vite frontend application
- `llamafiles/`: Contains the llamafile executable for quiz generation

## Prerequisites

- Python 3.10+ (recommended 3.13)
- Node.js 16+ (recommended 19+)
- npm 8+ (included with Node.js)
- llamafile (optional for AI-powered quiz generation)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/MindClash.git
cd MindClash
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate
```

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd ../frontend

# Install dependencies
npm install
```

### 4. LLamafile Setup (Optional)

Download the appropriate llamafile for your operating system:

```bash
# Navigate to the llamafiles directory
mkdir -p llamafiles
cd llamafiles

# Download llamafile (example for macOS)
# For macOS:
curl -L -o llamafile-mac https://huggingface.co/cebtenzzre/llama2-7b-chat-gguf/resolve/main/llama-2-7b-chat.llamafile
chmod +x llamafile-mac

# For Linux:
# curl -L -o llamafile-linux https://huggingface.co/cebtenzzre/llama2-7b-chat-gguf/resolve/main/llama-2-7b-chat.llamafile
# chmod +x llamafile-linux

# For Windows:
# curl -L -o llamafile.exe https://huggingface.co/cebtenzzre/llama2-7b-chat-gguf/resolve/main/llama-2-7b-chat.llamafile.exe
```

Note: If you encounter issues with llamafile execution, the application will use pre-defined templates for quiz generation.

## Running the Application

### 1. Start the Backend Server

```bash
cd backend
source venv/bin/activate

# If using llamafile
export LLAMAFILE_PATH="/path/to/MindClash/llamafiles/llamafile-mac"  # Replace with your OS version

# Start the Django server
python manage.py runserver
```

### 2. Start the Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173

## Key Features

- AI-powered quiz generation using llamafile
- Pre-defined templates for popular topics
- Real-time scoring and results
- Timer-based quiz challenges
- Mobile-responsive design

## Common Errors and Solutions

### 1. Llamafile Execution Error

**Error:**
```
Error calling llamafile: [Errno 8] Exec format error: '/path/to/llamafile'
```

**Solution:**
This usually happens when you try to run a llamafile compiled for a different architecture. Here's how we resolved it:

1. **Architecture Mismatch**: Ensure you download the correct version for your OS
   ```bash
   # For macOS:
   curl -L -o llamafile-mac https://huggingface.co/cebtenzzre/llama2-7b-chat-gguf/resolve/main/llama-2-7b-chat.llamafile
   ```

2. **Executable Permissions**: Make the file executable
   ```bash
   chmod +x llamafiles/llamafile-mac
   ```

3. **Fallback Mechanism**: If llamafile doesn't work, we implemented fallback templates in the application. The code tries to use llamafile, and if it fails, it switches to pre-defined templates:
   ```python
   # In llamafileService.py
   try:
       # Try to generate with llamafile
       # ...
   except:
       # Use fallback templates
       return get_questions_for_topic(topic, num_questions)
   ```

### 2. CORS Issues with Django

**Error:**
```
Forbidden (Origin checking failed - http://localhost:5173 does not match any trusted origins.): /api/quiz/10/check/
[14/Mar/2025 04:40:29] "POST /api/quiz/10/check/ HTTP/1.1" 403 2554
```

**Solution:**
1. Install the Django CORS headers package if not already installed:
   ```bash
   pip install django-cors-headers
   ```

2. Ensure CORS settings in Django's settings.py include your frontend URL:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:5173",  
       "http://127.0.0.1:5173",
   ]

   CORS_ALLOW_CREDENTIALS = True
   CSRF_TRUSTED_ORIGINS = [
       "http://localhost:5173",
       "http://127.0.0.1:5173",
   ]
   ```

3. Add CSRF exemption to specific views that handle POST requests:
   ```python
   from django.views.decorators.csrf import csrf_exempt

   @csrf_exempt
   def check_answers(request, quiz_id):
       # function body
   ```

### 3. Multiple Instances Conflict

**Error:**
```
Error: That port is already in use.
```

**Solution:**
1. Kill the process using the port before starting a new instance:
   ```bash
   # For macOS/Linux
   kill -9 $(lsof -ti :8000)
   
   # Alternative combined with server start
   kill -9 $(lsof -ti :8000) || true && source venv/bin/activate && python manage.py runserver
   ```

2. For the frontend (Vite server):
   ```bash
   pkill -f vite || true && npm run dev
   ```

### 4. API Request Issues

**Error:**
Frontend showing "Failed to generate quiz" despite backend working.

**Solution:**
1. Create a dedicated service layer to handle API requests with proper credentials:
   ```javascript
   // QuizService.js
   static async submitAnswers(quizId, answers) {
     try {
       const response = await fetch(`/api/quiz/${quizId}/check/`, {
         method: 'POST',
         credentials: 'include',
         headers: {
           'Content-Type': 'application/json',
           'Accept': 'application/json',
         },
         body: JSON.stringify({ answers })
       });
       
       if (!response.ok) {
         throw new Error(`Failed to submit answers: ${response.statusText}`);
       }
       
       return await response.json();
     } catch (error) {
       console.error('Error submitting answers:', error);
       throw error;
     }
   }
   ```

2. Update your Vite configuration to properly proxy API requests:
   ```javascript
   // vite.config.js
   export default defineConfig({
     // ...
     server: {
       proxy: {
         '/api': {
           target: 'http://127.0.0.1:8000',
           changeOrigin: true,
           secure: false
         }
       }
     }
   })
   ```

### 5. Navigation Issues

**Error:**
"Try Another Quiz" button causing a 404 error by navigating to non-existent routes.

**Solution:**
1. Update navigation paths to point to existing routes:
   ```javascript
   // In Quiz.jsx
   const handleNewQuiz = () => {
     navigate('/');  // Navigate back to home/quiz generator page instead of '/quiz/categories'
   };
   ```

### 6. Script Execution in Project Root

**Error:**
```
npm error Missing script: "dev"
```

**Solution:**
Always run commands from the correct subdirectory:
```bash
# Incorrect
cd MindClash-main && npm run dev  # Will fail

# Correct
cd MindClash-main/frontend && npm run dev  # Will work
```

## Troubleshooting

### CORS Issues

If you encounter CORS issues, ensure the Django settings has the correct frontend URL:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Your frontend URL
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### Port Already in Use

If port 8000 is already in use, you can kill the process:

```bash
# For macOS/Linux
kill -9 $(lsof -ti :8000)

# For Windows
# netstat -ano | findstr :8000
# taskkill /PID <PID> /F
```

### Llamafile Execution Error

If you encounter "Exec format error" with llamafile, ensure you've:

1. Downloaded the correct version for your OS
2. Made the file executable with `chmod +x`
3. Set the correct path in the LLAMAFILE_PATH environment variable

## Pushing to GitHub

To push your changes to a GitHub repository:

1. Create a new repository on GitHub
2. Initialize git in your local project (if not already done):

```bash
git init
```

3. Add your files:

```bash
git add .
```

4. Commit your changes:

```bash
git commit -m "Initial commit with llamafile integration"
```

5. Add the remote repository:

```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
```

6. Push to GitHub:

```bash
git push -u origin main
```

Note: If your default branch is 'master' instead of 'main', use that instead.

## License

[MIT License](LICENSE)
