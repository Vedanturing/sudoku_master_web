import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import { useAICoachingStore } from '../store/aiCoachingStore';
import { useSudokuStore } from '../store/sudokuStore';
import { TeachingHint, TeachingRequest } from '../services/aiTeachingService';
import { AnalyticsRequest } from '../services/aiAnalyticsService';

interface AICoachingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AICoachingPanel: React.FC<AICoachingPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'hints' | 'analytics' | 'settings'>('hints');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState('');

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
      await getHint(request);
    } catch (error) {
      console.error('Failed to get hint:', error);
    }
  };

  const handleAnalyzePuzzle = async () => {
    if (!solution) return;

    // Convert grid to number array and track user moves
    const currentGrid = grid.map(row => row.map(cell => cell.value));
    const userMoves = []; // This would need to be tracked in the sudoku store
    
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
      await analyzePuzzle(request);
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
      {currentSession?.hints && currentSession.hints.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Recent Hints:</h4>
          {currentSession.hints.map((hint, index) => (
            <HintCard key={hint.id} hint={hint} index={index} />
          ))}
        </div>
      )}
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
      {currentSession?.analysis && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Analysis Results:</h4>
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
        </div>
      )}
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

          {/* Content */}
          <div className="p-4">
            {activeTab === 'hints' && renderHintSection()}
            {activeTab === 'analytics' && renderAnalyticsSection()}
            {activeTab === 'settings' && renderSettingsSection()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
