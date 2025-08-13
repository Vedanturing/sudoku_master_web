# AI Coaching System for Sudoku Master

## Overview

The AI Coaching System provides an intelligent, personalized learning experience for Sudoku players using two specialized AI models:

1. **Teaching AI (DeepSeek R1)**: Provides hints, explanations, and step-by-step guidance
2. **Analytics AI (Qwen 2.5)**: Analyzes completed puzzles and generates performance reports

## Features

### 🧠 AI Teaching Service
- **Contextual Hints**: AI-generated hints based on current puzzle state and user level
- **Technique Explanations**: Detailed explanations of Sudoku techniques with examples
- **Step-by-Step Guidance**: Progressive solving assistance for complex puzzles
- **Hodoku Integration**: References to standard technique naming conventions
- **Adaptive Difficulty**: Adjusts teaching style based on user skill level

### 📊 AI Analytics Service
- **Performance Analysis**: Comprehensive evaluation of solving approach
- **Strengths & Weaknesses**: Identifies areas of improvement and strong points
- **Technique Usage Tracking**: Monitors which techniques are used effectively
- **Training Recommendations**: Personalized suggestions for skill development
- **Progress Tracking**: Historical analysis of improvement over time

### 🎯 History Tracking
- **Game History**: Complete record of all played puzzles
- **AI Analysis Reports**: Stored analysis results for each completed game
- **Coaching Sessions**: History of AI coaching interactions
- **Performance Metrics**: Time, mistakes, hints used, and techniques applied

### 🎨 Enhanced UI/UX
- **AI Coaching Panel**: Slide-out panel with tabs for hints, analytics, and settings
- **Tooltips**: Explanatory tooltips for AI suggestions and techniques
- **Progress Charts**: Visual representation of performance trends
- **Mobile-Friendly**: Responsive design for all device sizes

## Architecture

### Services

#### `aiTeachingService.ts`
- Handles all interactions with DeepSeek R1 model
- Generates contextual hints and explanations
- Parses AI responses into structured data
- Manages technique identification and examples

#### `aiAnalyticsService.ts`
- Interfaces with Qwen 2.5 model for analysis
- Processes puzzle completion data
- Generates performance reports and recommendations
- Tracks technique usage patterns

#### `aiCoachingStore.ts`
- Zustand store for managing coaching state
- Handles user preferences and settings
- Manages coaching sessions and history
- Coordinates between teaching and analytics services

### Database Integration

#### New Collections
- `game_history`: Stores completed game data with AI analysis
- `ai_coaching_sessions`: Tracks coaching interactions
- `training_recommendations`: Stores personalized training suggestions

#### Data Models
```typescript
interface GameHistory {
  id: string;
  userId: string;
  puzzleId: string;
  puzzle: number[][];
  solution: number[][];
  difficulty: string;
  datePlayed: Date;
  completionStatus: 'won' | 'lost' | 'incomplete';
  timeTaken: number;
  aiAnalysisReport?: AIAnalysisReport;
  techniquesUsed: string[];
  mistakes: number;
  hintsUsed: number;
  userMoves: UserMove[];
}
```

### Components

#### `AICoachingPanel.tsx`
- Main coaching interface with tabbed navigation
- Hint generation and display
- Performance analytics
- User preference settings

#### `HistoryPage.tsx`
- Comprehensive game history view
- AI analysis report display
- Progress charts and statistics
- Replay and improvement features

## Configuration

### Environment Variables

```bash
# DeepSeek API (Teaching AI)
NEXT_PUBLIC_DEEPSEEK_API_KEY=your_api_key_here
NEXT_PUBLIC_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# Qwen API (Analytics AI)
NEXT_PUBLIC_QWEN_API_KEY=your_api_key_here
NEXT_PUBLIC_QWEN_API_URL=https://api.qwen.ai/v1/chat/completions
```

### User Preferences

The system supports three coaching modes:
- **Beginner**: Step-by-step guidance with frequent hints
- **Intermediate**: Occasional hints with technique explanations
- **Expert**: Minimal hints with detailed analytics

## Usage

### Getting AI Hints

1. Click the "AI Coach" button during gameplay
2. Select the "Hints" tab
3. Optionally ask a specific question or select a technique to focus on
4. Click "Get AI Hint" to receive personalized guidance

### Analyzing Performance

1. Complete a puzzle
2. Open the AI Coaching Panel
3. Navigate to the "Analytics" tab
4. Click "Analyze Performance" to get detailed insights

### Viewing History

1. Navigate to the History page
2. Browse completed games and coaching sessions
3. View AI analysis reports
4. Use "Improve with AI" to get targeted training

## API Integration

### DeepSeek R1 (Teaching)
- **Model**: `deepseek/deepseek-r1:free`
- **Purpose**: Generating hints and explanations
- **Input**: Puzzle state, user level, specific questions
- **Output**: Structured hints with technique identification

### Qwen 2.5 (Analytics)
- **Model**: `qwen/qwen-2.5-72b-instruct:free`
- **Purpose**: Performance analysis and recommendations
- **Input**: Completed puzzle data, user moves, timing
- **Output**: Performance scores, insights, and training plans

## Data Flow

```
User Action → AI Service → Response Parsing → Store Update → UI Update
     ↓
Database Storage → History Tracking → Progress Analysis
```

## Security Considerations

- API keys are stored in environment variables
- No sensitive data is exposed to the client
- User authentication required for history access
- Rate limiting implemented for API calls

## Performance Optimization

- Caching of AI responses in coaching sessions
- Lazy loading of history data
- Efficient database queries with proper indexing
- Debounced API calls to prevent spam

## Future Enhancements

### Planned Features
- **Voice Explanations**: Audio guidance for techniques
- **Video Tutorials**: Embedded technique demonstrations
- **Social Learning**: Share insights with other players
- **Advanced Analytics**: Machine learning-based progress prediction

### Technical Improvements
- **Offline Mode**: Cached responses for offline use
- **Batch Processing**: Analyze multiple games simultaneously
- **Real-time Updates**: Live coaching during gameplay
- **Multi-language Support**: Localized AI responses

## Troubleshooting

### Common Issues

1. **API Key Errors**: Verify environment variables are set correctly
2. **Slow Responses**: Check API rate limits and network connectivity
3. **Missing Data**: Ensure database collections are properly initialized
4. **UI Not Loading**: Check for JavaScript errors in browser console

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_AI_COACHING=true
```

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Implement proper error handling
- Add comprehensive JSDoc comments

### Testing

- Unit tests for AI services
- Integration tests for database operations
- E2E tests for user workflows
- Performance testing for API calls

## License

This AI coaching system is part of the Sudoku Master application and follows the same licensing terms.

## Support

For technical support or feature requests, please:
1. Check the existing documentation
2. Search for similar issues in the repository
3. Create a detailed issue report
4. Include relevant logs and error messages
