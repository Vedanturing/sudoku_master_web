import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Play, 
  BarChart3, 
  Brain, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp,
  RefreshCw,
  Filter,
  Search,
  Download,
  Eye,
  BrainCircuit,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAICoachingStore } from '../store/aiCoachingStore';
import { GameHistory, AICoachingSession } from '../database/mongoClientTypes';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HistoryPage: React.FC = () => {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [coachingSessions, setCoachingSessions] = useState<AICoachingSession[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  const [selectedSession, setSelectedSession] = useState<AICoachingSession | null>(null);
  const [activeTab, setActiveTab] = useState<'games' | 'coaching' | 'analytics'>('games');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuthStore();
  const { startCoachingSession } = useAICoachingStore();

  // Mock data for now - in real implementation, this would come from the database
  useEffect(() => {
    // Simulate loading data
    setIsLoading(true);
    setTimeout(() => {
      setGameHistory([
        {
          id: '1',
          userId: user?.uid || 'user1',
          puzzleId: 'puzzle1',
          puzzle: Array(9).fill(Array(9).fill(0)),
          solution: Array(9).fill(Array(9).fill(0)),
          difficulty: 'medium',
          datePlayed: new Date('2024-01-15'),
          completionStatus: 'won',
          timeTaken: 450,
          aiAnalysisReport: {
            analysisId: 'analysis1',
            overallScore: 85,
            strengths: ['Good pattern recognition', 'Efficient solving'],
            weaknesses: ['Could improve on advanced techniques'],
            recommendations: ['Practice X-Wing technique', 'Focus on time management']
          },
          techniquesUsed: ['naked single', 'hidden single', 'naked pair'],
          mistakes: 2,
          hintsUsed: 1,
          userMoves: []
        },
        {
          id: '2',
          userId: user?.uid || 'user1',
          puzzleId: 'puzzle2',
          puzzle: Array(9).fill(Array(9).fill(0)),
          solution: Array(9).fill(Array(9).fill(0)),
          difficulty: 'hard',
          datePlayed: new Date('2024-01-14'),
          completionStatus: 'won',
          timeTaken: 720,
          aiAnalysisReport: {
            analysisId: 'analysis2',
            overallScore: 78,
            strengths: ['Persistent problem solving'],
            weaknesses: ['Advanced technique application'],
            recommendations: ['Study Swordfish technique', 'Practice XY-Wing']
          },
          techniquesUsed: ['naked single', 'hidden single'],
          mistakes: 4,
          hintsUsed: 2,
          userMoves: []
        }
      ]);

      setCoachingSessions([
        {
          id: 'session1',
          userId: user?.uid || 'user1',
          puzzleId: 'puzzle1',
          sessionType: 'combined',
          teachingHints: [
            {
              id: 'hint1',
              type: 'strategy',
              message: 'Look for naked singles in the top row',
              technique: 'naked single',
              difficulty: 'intermediate'
            }
          ],
          analyticsReport: {
            analysisId: 'analysis1',
            overallScore: 85,
            insights: ['Good basic solving skills'],
            recommendations: ['Practice advanced techniques']
          },
          userLevel: 'intermediate',
          createdAt: new Date('2024-01-15'),
          lastUpdated: new Date('2024-01-15')
        }
      ]);

      setIsLoading(false);
    }, 1000);
  }, [user]);

  const filteredGames = gameHistory.filter(game => {
    const matchesDifficulty = filterDifficulty === 'all' || game.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'all' || game.completionStatus === filterStatus;
    const matchesSearch = searchTerm === '' || 
      game.difficulty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.techniquesUsed.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesDifficulty && matchesStatus && matchesSearch;
  });

  const handleReplayGame = (game: GameHistory) => {
    // In a real implementation, this would load the puzzle into the game
    console.log('Replaying game:', game);
    // You could navigate to the game page with the puzzle data
  };

  const handleViewAnalysis = (game: GameHistory) => {
    setSelectedGame(game);
  };

  const handleImproveWithAI = (game: GameHistory) => {
    if (game.aiAnalysisReport) {
      // Start a new coaching session focused on the weaknesses
      startCoachingSession(game.puzzleId, 'combined');
      // Navigate to training page or show coaching panel
    }
  };

  const handleDownloadReport = (game: GameHistory) => {
    // Generate and download PDF report
    console.log('Downloading report for game:', game);
  };

  const renderGameHistory = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search techniques..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Game List */}
      <div className="space-y-3">
        {filteredGames.map((game) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  game.completionStatus === 'won' ? 'bg-green-500' :
                  game.completionStatus === 'lost' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)} Puzzle
                </span>
                <span className="text-sm text-gray-500">
                  {game.datePlayed.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {Math.floor(game.timeTaken / 60)}:{(game.timeTaken % 60).toString().padStart(2, '0')}
                </span>
                {game.aiAnalysisReport && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    AI Analyzed
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Status: {game.completionStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span>Mistakes: {game.mistakes}</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-yellow-500" />
                <span>Hints: {game.hintsUsed}</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span>Techniques: {game.techniquesUsed.length}</span>
              </div>
            </div>

            {game.techniquesUsed.length > 0 && (
              <div className="mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Techniques used: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {game.techniquesUsed.map((technique, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"
                    >
                      {technique}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReplayGame(game)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                Replay
              </button>
              
              {game.aiAnalysisReport && (
                <button
                  onClick={() => handleViewAnalysis(game)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Report
                </button>
              )}

              {game.aiAnalysisReport && (
                <button
                  onClick={() => handleImproveWithAI(game)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Improve with AI
                </button>
              )}

              <button
                onClick={() => handleDownloadReport(game)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCoachingSessions = () => (
    <div className="space-y-4">
      {coachingSessions.map((session) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900 dark:text-white">
                {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)} Session
              </span>
              <span className="text-sm text-gray-500">
                {session.createdAt.toLocaleDateString()}
              </span>
            </div>
            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
              {session.userLevel}
            </span>
          </div>

          <div className="mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Hints provided: {session.teachingHints.length}
            </span>
            {session.analyticsReport && (
              <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                • Analysis score: {session.analyticsReport.overallScore}/100
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSession(session)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderAnalytics = () => {
    const performanceData = {
      labels: gameHistory.map(game => game.datePlayed.toLocaleDateString()),
      datasets: [
        {
          label: 'Performance Score',
          data: gameHistory.map(game => game.aiAnalysisReport?.overallScore || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Time (minutes)',
          data: gameHistory.map(game => game.timeTaken / 60),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1,
        }
      ]
    };

    const techniqueData = {
      labels: ['Naked Single', 'Hidden Single', 'Naked Pair', 'Hidden Pair', 'X-Wing', 'Y-Wing'],
      datasets: [{
        label: 'Usage Count',
        data: [12, 8, 6, 4, 2, 1],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      }]
    };

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {gameHistory.length > 0 
                ? Math.round(gameHistory.reduce((sum, game) => sum + (game.aiAnalysisReport?.overallScore || 0), 0) / gameHistory.length)
                : 0
              }/100
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Time</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {gameHistory.length > 0 
                ? Math.round(gameHistory.reduce((sum, game) => sum + game.timeTaken, 0) / gameHistory.length / 60)
                : 0
              }m
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Games Won</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {gameHistory.filter(game => game.completionStatus === 'won').length}
            </span>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Performance Over Time</h3>
          <Line data={performanceData} options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              },
            },
          }} />
        </div>

        {/* Technique Usage Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Technique Usage</h3>
          <Bar data={techniqueData} options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }} />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Game History</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review your past games, AI analysis reports, and track your progress over time.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'games', label: 'Games', icon: History, count: gameHistory.length },
            { id: 'coaching', label: 'AI Coaching', icon: Brain, count: coachingSessions.length },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mb-8">
          {activeTab === 'games' && renderGameHistory()}
          {activeTab === 'coaching' && renderCoachingSessions()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>

        {/* Analysis Modal */}
        {selectedGame && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Analysis Report</h3>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              {selectedGame.aiAnalysisReport && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="text-lg font-medium">Overall Score: {selectedGame.aiAnalysisReport.overallScore}/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {selectedGame.aiAnalysisReport.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Areas to Improve</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {selectedGame.aiAnalysisReport.weaknesses.map((weakness, index) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {selectedGame.aiAnalysisReport.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coaching Session Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Coaching Session Details</h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Session Type:</span>
                    <p className="font-medium">{selectedSession.sessionType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">User Level:</span>
                    <p className="font-medium">{selectedSession.userLevel}</p>
                  </div>
                </div>

                {selectedSession.teachingHints.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Teaching Hints</h4>
                    <div className="space-y-2">
                      {selectedSession.teachingHints.map((hint, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                              {hint.type}
                            </span>
                            {hint.technique && (
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                                {hint.technique}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{hint.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSession.analyticsReport && (
                  <div>
                    <h4 className="font-medium mb-2">Analytics Report</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Score: {selectedSession.analyticsReport.overallScore}/100
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
