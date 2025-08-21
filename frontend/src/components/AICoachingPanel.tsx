import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  Brain, 
  BarChart3, 
  Settings, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send
} from 'lucide-react';
import { useAICoachingStore } from '../store/aiCoachingStore';
import { useSudokuStore } from '../store/sudokuStore';
import { TeachingHint, TeachingRequest } from '../services/aiTeachingService';
import { AnalyticsRequest } from '../services/aiAnalyticsService';
import { getAIConfig } from '../config/aiConfig';

interface AICoachingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AICoachingPanel: React.FC<AICoachingPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'hints' | 'analytics' | 'chat' | 'settings'>('hints');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    technique?: string;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const {
    preferences,
    currentSession,
    isLoading,
    isGeneratingHint,
    isAnalyzing,
    updatePreferences,
    getHint,
    analyzePuzzle,
    explainTechnique,
    startCoachingSession
  } = useAICoachingStore();

  const {
    grid,
    solution,
    difficulty,
    timer,
    hintsRemaining,
    checkCount
  } = useSudokuStore();

  // Initialize coaching session when panel opens
  useEffect(() => {
    if (isOpen && !currentSession) {
      console.log('Starting new coaching session...');
      startCoachingSession('current-game', 'combined');
    }
  }, [isOpen, currentSession, startCoachingSession]);

  // Debug logging for session state
  useEffect(() => {
    console.log('Current session state:', currentSession);
    console.log('Session hints:', currentSession?.hints);
    console.log('Session analysis:', currentSession?.analysis);
  }, [currentSession]);

  const handleGetHint = async () => {
    if (!solution) return;

    const request: TeachingRequest = {
      puzzle: grid.map(row => row.map(cell => cell.value)),
      currentState: grid.map(row => row.map(cell => cell.value)),
      difficulty,
      userLevel: preferences.userLevel,
      specificQuestion: customQuestion || undefined,
      technique: selectedTechnique || undefined
    };

    try {
      console.log('Requesting hint with:', request);
      const response = await getHint(request);
      console.log('Hint response received:', response);
    } catch (error) {
      console.error('Failed to get hint:', error);
    }
  };

  const handleAnalyzePuzzle = async () => {
    if (!solution) return;

    // Convert grid to number array and track user moves
    const currentGrid = grid.map(row => row.map(cell => cell.value));
    const userMoves: Array<{row: number, col: number, value: number, timestamp: number, wasCorrect: boolean}> = []; // This would need to be tracked in the sudoku store
    
    const request: AnalyticsRequest = {
      puzzle: currentGrid,
      solution,
      userMoves,
      difficulty,
      solveTime: timer.elapsedTime,
      hintsUsed: 3 - hintsRemaining,
      mistakes: checkCount,
      techniquesAttempted: [] // This would need to be tracked
    };

    try {
      console.log('Requesting puzzle analysis with:', request);
      const response = await analyzePuzzle(request);
      console.log('Analysis response received:', response);
    } catch (error) {
      console.error('Failed to analyze puzzle:', error);
    }
  };

  const handleExplainTechnique = async (technique: string) => {
    try {
      await explainTechnique(technique);
    } catch (error) {
      console.error('Failed to explain technique:', error);
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Create a comprehensive prompt for the AI
      const prompt = `You are an expert Sudoku coach having a conversation with a student. 

Current context:
- User level: ${preferences.userLevel}
- Current difficulty: ${difficulty}
- User just asked: "${message}"

Please provide a helpful, conversational response that:
1. Answers their question directly and clearly
2. Uses examples when helpful
3. Suggests related techniques to practice
4. Encourages learning and practice
5. Adapts to their skill level
6. References standard Sudoku terminology from hodoku.sourceforge.net

Keep your response conversational but educational. If they're asking about a specific technique, explain it with examples. If they're asking for general advice, provide actionable tips.`;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          userLevel: preferences.userLevel,
          difficulty: difficulty
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.response || 'I apologize, but I\'m having trouble responding right now. Please try asking your question again.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback response if API fails
        const fallbackMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: `I'd be happy to help you with "${message}"! Since I'm currently in fallback mode, here are some general tips:

🔍 **For Technique Questions**: Look for patterns like naked singles, hidden singles, and pairs
📚 **For Learning**: Practice with easier puzzles first, then gradually increase difficulty
⏱️ **For Speed**: Focus on accuracy before speed - good technique leads to faster solving
🎯 **For Specific Help**: Try asking about specific techniques like "What is a naked single?" or "How do I find hidden pairs?"

What specific aspect of Sudoku would you like to learn more about?`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'I apologize, but I\'m having trouble responding right now. Please try asking your question again or check your internet connection.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatMessage(chatInput);
    }
  };

  const renderHintSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">AI Hints & Guidance</h3>
      </div>

      {/* Custom Question Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Ask a specific question:
        </label>
        <textarea
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="e.g., 'What should I look for next?' or 'How do I solve this section?'"
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={3}
        />
      </div>

      {/* Technique Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Focus on specific technique:
        </label>
        <select
          value={selectedTechnique}
          onChange={(e) => setSelectedTechnique(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Any technique</option>
          <option value="naked single">Naked Single</option>
          <option value="hidden single">Hidden Single</option>
          <option value="naked pair">Naked Pair</option>
          <option value="hidden pair">Hidden Pair</option>
          <option value="x-wing">X-Wing</option>
          <option value="y-wing">Y-Wing</option>
          <option value="swordfish">Swordfish</option>
          <option value="xy-wing">XY-Wing</option>
        </select>
      </div>

      {/* Get Hint Button */}
      <button
        onClick={handleGetHint}
        disabled={isGeneratingHint || !solution}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        {isGeneratingHint ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Generating Hint...
          </>
        ) : (
          <>
            <Lightbulb className="w-4 h-4" />
            Get AI Hint
          </>
        )}
      </button>



      {/* Current Hints */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Recent Hints:</h4>
        {currentSession?.hints && currentSession.hints.length > 0 ? (
          currentSession.hints.map((hint, index) => (
            <HintCard key={hint.id} hint={hint} index={index} />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hints yet. Click "Get AI Hint" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Performance Analytics</h3>
      </div>

      {/* Current Game Stats */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Current Game:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>Time: {Math.floor(timer.elapsedTime / 60)}:{(timer.elapsedTime % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Checks: {checkCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>Hints: {3 - hintsRemaining}/3</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-red-500" />
            <span>Difficulty: {difficulty}</span>
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyzePuzzle}
        disabled={isAnalyzing || !solution}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Analyzing...
          </>
        ) : (
          <>
            <BarChart3 className="w-4 h-4" />
            Analyze Performance
          </>
        )}
      </button>

      {/* Analysis Results */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">Analysis Results:</h4>
        {currentSession?.analysis ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Score: {currentSession.analysis.analysis.overallScore}/100</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-green-600">Strengths:</span>
                <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                  {currentSession.analysis.analysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium text-red-600">Areas to Improve:</span>
                <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                  {currentSession.analysis.analysis.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No analysis yet. Click "Analyze Performance" to get insights!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderChatSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">AI Chat Coach</h3>
      </div>

      {/* Chat Messages */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Start a conversation with your AI coach!</p>
            <p className="text-xs mt-1">Ask about techniques, strategies, or get personalized advice.</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about Sudoku techniques, strategies, or get personalized advice..."
            className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            rows={3}
            disabled={isChatLoading}
          />
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </div>
          <button
            onClick={() => handleChatMessage(chatInput)}
            disabled={isChatLoading || !chatInput.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Quick Questions:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'What is a naked single?',
            'How do I find hidden pairs?',
            'Tips for beginners?',
            'Speed solving advice?'
          ].map((question) => (
                         <button
               key={question}
               onClick={() => setChatInput(question)}
               className="text-xs p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
             >
               {question}
             </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">AI Coaching Settings</h3>
      </div>

      {/* User Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Your Skill Level:
        </label>
        <select
          value={preferences.userLevel}
          onChange={(e) => updatePreferences({ userLevel: e.target.value as any })}
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="beginner">Beginner - More step-by-step guidance</option>
          <option value="intermediate">Intermediate - Occasional hints</option>
          <option value="expert">Expert - Minimal hints, more analytics</option>
        </select>
      </div>

      {/* Coaching Mode */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Coaching Mode:
        </label>
        <select
          value={preferences.coachingMode}
          onChange={(e) => updatePreferences({ coachingMode: e.target.value as any })}
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="step-by-step">Step-by-step guidance</option>
          <option value="occasional-hints">Occasional hints</option>
          <option value="minimal-hints">Minimal hints</option>
        </select>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.enableTooltips}
            onChange={(e) => updatePreferences({ enableTooltips: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Enable tooltips for AI suggestions</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.showHodokuReferences}
            onChange={(e) => updatePreferences({ showHodokuReferences: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show hodoku.sourceforge.net references</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoAnalyzePuzzles}
            onChange={(e) => updatePreferences({ autoAnalyzePuzzles: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Auto-analyze completed puzzles</span>
        </label>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Coach</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tab Navigation */}
                         <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
               {[
                 { id: 'hints', label: 'Hints', icon: Lightbulb },
                 { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                 { id: 'chat', label: 'Chat', icon: MessageCircle },
                 { id: 'settings', label: 'Settings', icon: Settings }
               ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

                {/* AI Status Banner */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <AIStatusBanner />
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 dark:text-gray-400">
              Debug Info (Click to expand)
            </summary>
            <div className="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <div>Session ID: {currentSession?.id || 'None'}</div>
              <div>Hints Count: {currentSession?.hints?.length || 0}</div>
              <div>Analysis: {currentSession?.analysis ? 'Available' : 'None'}</div>
              <div>API Key: {getAIConfig().openrouter.apiKey ? 'Configured' : 'Missing'}</div>
              <div>Timer: {timer.elapsedTime}ms ({Math.floor(timer.elapsedTime / 1000)}s)</div>
            </div>
          </details>
        </div>
      )}

                     {/* Content */}
           <div className="p-4">
             {activeTab === 'hints' && renderHintSection()}
             {activeTab === 'analytics' && renderAnalyticsSection()}
             {activeTab === 'chat' && renderChatSection()}
             {activeTab === 'settings' && renderSettingsSection()}
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// AI Status Banner Component
const AIStatusBanner: React.FC = () => {
  const config = getAIConfig();
  const hasApiKey = !!config.openrouter.apiKey;

  if (hasApiKey) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle className="w-4 h-4" />
        <span>AI features enabled</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            AI features in fallback mode
          </p>
          <p className="text-amber-600 dark:text-amber-300 text-xs mt-1">
            To enable full AI coaching with DeepSeek and Qwen models, get your free API key from 
            <a 
              href="https://openrouter.ai" 
              target="_blank" 
              className="underline hover:text-amber-800 dark:hover:text-amber-100"
            >
              OpenRouter.ai
            </a>
            {' '}and add it to your environment variables. 
            <a 
              href="/AI_SETUP_GUIDE.md" 
              target="_blank" 
              className="underline hover:text-amber-800 dark:hover:text-amber-100"
            >
              Setup Guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Hint Card Component
interface HintCardProps {
  hint: TeachingHint;
  index: number;
}

const HintCard: React.FC<HintCardProps> = ({ hint, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
            {hint.type}
          </span>
          {hint.technique && (
            <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
              {hint.technique}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-600" />
          )}
        </button>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
        {hint.message}
      </p>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-2"
        >
          {hint.examples && hint.examples.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Examples:</span>
              <ul className="list-disc list-inside ml-2 text-xs text-gray-600 dark:text-gray-400">
                {hint.examples.map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            </div>
          )}

          {hint.hodokuReference && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-3 h-3 text-blue-600" />
              <a
                href={hint.hodokuReference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View on Hodoku
              </a>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AICoachingPanel;
