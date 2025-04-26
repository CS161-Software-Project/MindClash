# How to Start MindClash in Dark Mode

This guide provides step-by-step instructions for starting both the backend and frontend servers for the MindClash application with the new dark mode UI.

## PowerShell Commands for Windows

Since you're on Windows using PowerShell, you'll need to run commands separately.

### Starting the Backend Server

1. Open a PowerShell terminal
2. Navigate to the backend directory (using quotes to handle spaces in the path):
   ```
   cd "C:\D drive\Courses\Django\MindClash\backend"
   ```
3. Start the Django development server:
   ```
   python manage.py runserver
   ```
4. You should see output indicating the server has started at http://127.0.0.1:8000/

### Starting the Frontend Server

1. Open another PowerShell terminal (a new window)
2. Navigate to the frontend directory (using quotes to handle spaces):
   ```
   cd "C:\D drive\Courses\Django\MindClash\frontend"
   ```
3. Start the Vite development server:
   ```
   npm run dev
   ```
4. You should see output indicating the server has started, typically at http://localhost:5173/

## Testing the Dark Mode Quiz Generator

Once both servers are running, you can access and test the dark mode quiz generator:

1. Open your browser and navigate to:
   ```
   http://localhost:5173/ai-quiz
   ```

2. You should see the updated dark mode UI for the quiz generator.

3. Fill in the form with:
   - Topic: Any topic you'd like to be quizzed on
   - Number of Questions: 1-10
   - Difficulty: Easy, Medium, or Hard

4. Click "Generate Quiz" to create and start the quiz.

## Troubleshooting

If you encounter any issues:

1. First, try the simple GROQ API test page at:
   ```
   http://localhost:5173/test-groq
   ```
   This can help isolate whether the issue is with the GROQ API integration or the quiz generator UI.

2. Check that both servers are running in their respective terminals.

3. Look for error messages in:
   - The Django terminal (backend errors)
   - The npm/Vite terminal (frontend build errors)
   - The browser console (press F12 to open developer tools)

For more detailed troubleshooting, refer to the TROUBLESHOOTING.md file. 