# Sudoku Master

A feature-rich, web-based Sudoku game with a powerful PDF generation feature, built with vanilla JavaScript and a Python backend.

## Features

- **Multiple Difficulty Levels**: Choose from Easy, Medium, Hard, and Expert.
- **Interactive Gameplay**: Smooth and intuitive interface for playing Sudoku.
- **Note-Taking**: In-game capability to jot down notes in cells.
- **Hint System**: Get hints when you're stuck (3 per game).
- **Undo/Redo**: Easily undo and redo your moves.
- **Timer**: Keep track of your solving time.
- **Cross-Platform**: Full support for both keyboard and mouse/touch inputs.
- **Custom Puzzle Creation**: Create and play your own Sudoku puzzles.
- **PDF Generation**: Generate a detailed, step-by-step PDF of your solution, including strategies used and move-by-move analysis powered by Google's Gemini AI.
- **AI Coaching System**: Advanced AI-driven coaching with DeepSeek R1 for teaching and Qwen 2.5 for analytics.
- **Personalized Learning**: Adaptive hints and step-by-step guidance based on your skill level.
- **Performance Analytics**: Comprehensive analysis of your solving approach with personalized improvement recommendations.
- **Game History**: Track your progress with detailed analytics and replay functionality.
- **Responsive Design**: Play on any device, with a fully responsive layout.

## Project Structure

```
.
├── backend
│   ├── app
│   │   ├── core
│   │   ├── routers
│   │   └── main.py
│   ├── requirements.txt
│   └── ...
└── frontend
    ├── src
    │   ├── components
    │   │   ├── AICoachingPanel.tsx
    │   │   ├── SudokuGame.tsx
    │   │   └── ...
    │   ├── services
    │   │   ├── aiTeachingService.ts
    │   │   ├── aiAnalyticsService.ts
    │   │   └── ...
    │   ├── store
    │   │   ├── aiCoachingStore.ts
    │   │   └── ...
    │   ├── pages
    │   │   ├── history.tsx
    │   │   └── ...
    │   └── database
    │       ├── mongoClient.ts
    │       └── mongoClientTypes.ts
    ├── css
    │   └── styles.css
    ├── js
    │   ├── app.js
    │   ├── document-generator.js
    │   ├── sudoku-ui.js
    │   └── sudoku.js
    └── index.html
```

## AI Coaching Features

The application now includes an advanced AI coaching system:

- **Teaching AI (DeepSeek R1)**: Provides contextual hints, technique explanations, and step-by-step guidance
- **Analytics AI (Qwen 2.5)**: Analyzes completed puzzles and generates performance reports
- **Personalized Learning**: Adapts coaching style based on user skill level (Beginner/Intermediate/Expert)
- **History Tracking**: Complete game history with AI analysis and progress tracking
- **Training Recommendations**: AI-generated suggestions for skill improvement

For detailed documentation, see [AI_COACHING_README.md](frontend/AI_COACHING_README.md).

## Local Development

To run the game and backend server locally with a single command:

1.  **Navigate to the `backend` directory**:
    ```bash
    cd backend
    ```
2.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run the server**:
    ```bash
    python run.py
    ```
4.  **Open your browser** and go to `http://localhost:8000`. The entire application (frontend and backend) will be running.

## Deployment

This project is ready for deployment on platforms like Vercel, Netlify, or Heroku.

1.  **Backend**: Deploy the `backend` directory as a Python web service.
2.  **Frontend**: Deploy the `frontend` directory as a static site.
3.  Ensure the frontend's API requests in `sudoku.js` and `document-generator.js` point to your deployed backend URL.

## License

This project is licensed under the MIT License. 