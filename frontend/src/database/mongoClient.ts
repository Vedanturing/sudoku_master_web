import { MongoClient, Db, Collection } from 'mongodb';
import type { UserStats, SavedPuzzle, UserReport, CompletedPuzzle, LeaderboardScore, GameHistory, AICoachingSession, TrainingRecommendation } from './mongoClientTypes';

// Server-side only check
if (typeof window !== 'undefined') {
  throw new Error('MongoDB client should only be used on the server side');
}

// Re-export types for convenience
export type { UserStats, SavedPuzzle, UserReport, CompletedPuzzle, LeaderboardScore };

// Singleton pattern for connection management
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

class MongoClientManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  // Collections
  private userStatsCollection: Collection<UserStats> | null = null;
  private savedPuzzlesCollection: Collection<SavedPuzzle> | null = null;
  private userReportsCollection: Collection<UserReport> | null = null;
  private completedPuzzlesCollection: Collection<CompletedPuzzle> | null = null;
  private leaderboardCollection: Collection<LeaderboardScore> | null = null;
  private gameHistoryCollection: Collection<GameHistory> | null = null;
  private aiCoachingCollection: Collection<AICoachingSession> | null = null;
  private trainingRecommendationsCollection: Collection<TrainingRecommendation> | null = null;

  async connect(): Promise<void> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      console.log('MongoDB integration is disabled');
      return;
    }

    if (this.isConnected) {
      return;
    }

    try {
      const mongoUri = process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error('MONGO_URI environment variable is not set');
      }

      // Use cached connection if available
      if (cachedClient && cachedDb) {
        this.client = cachedClient;
        this.db = cachedDb;
        this.isConnected = true;
        this.initializeCollections();
        return;
      }

      this.client = new MongoClient(mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
      });

      await this.client.connect();
      this.db = this.client.db('sudoku_master');
      
      // Cache the connection
      cachedClient = this.client;
      cachedDb = this.db;
      
      // Initialize collections
      this.initializeCollections();
      
      // Create indexes for better performance
      await this.createIndexes();
      
      this.isConnected = true;
      console.log('Successfully connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private initializeCollections(): void {
    if (!this.db) return;
    
    this.userStatsCollection = this.db.collection<UserStats>('user_stats');
    this.savedPuzzlesCollection = this.db.collection<SavedPuzzle>('saved_puzzles');
    this.userReportsCollection = this.db.collection<UserReport>('user_reports');
    this.completedPuzzlesCollection = this.db.collection<CompletedPuzzle>('puzzles_completed');
    this.leaderboardCollection = this.db.collection<LeaderboardScore>('leaderboard');
    this.gameHistoryCollection = this.db.collection<GameHistory>('game_history');
    this.aiCoachingCollection = this.db.collection<AICoachingSession>('ai_coaching_sessions');
    this.trainingRecommendationsCollection = this.db.collection<TrainingRecommendation>('training_recommendations');
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // User stats indexes
      await this.userStatsCollection?.createIndex({ userId: 1 }, { unique: true });
      
      // Saved puzzles indexes
      await this.savedPuzzlesCollection?.createIndex({ userId: 1 });
      await this.savedPuzzlesCollection?.createIndex({ puzzleId: 1 }, { unique: true });
      await this.savedPuzzlesCollection?.createIndex({ userId: 1, isCompleted: 1 });
      
      // User reports indexes
      await this.userReportsCollection?.createIndex({ userId: 1 });
      await this.userReportsCollection?.createIndex({ userId: 1, reportType: 1 });
      await this.userReportsCollection?.createIndex({ createdAt: -1 });
      
      // Completed puzzles indexes
      await this.completedPuzzlesCollection?.createIndex({ userId: 1 });
      await this.completedPuzzlesCollection?.createIndex({ userId: 1, difficulty: 1 });
      await this.completedPuzzlesCollection?.createIndex({ completedAt: -1 });
      
      // Leaderboard indexes
      await this.leaderboardCollection?.createIndex({ difficulty: 1, technique: 1 });
      await this.leaderboardCollection?.createIndex({ score: -1 });
      await this.leaderboardCollection?.createIndex({ timestamp: -1 });
      
      console.log('MongoDB indexes created successfully');
    } catch (error) {
      console.error('Failed to create MongoDB indexes:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.client !== cachedClient) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  private checkConnection(): void {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB connection not established');
    }
  }

  // User Stats Functions
  async saveUserStats(userId: string, statsData: Partial<UserStats>): Promise<void> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return;
    }

    this.checkConnection();
    
    try {
      const updateData = {
        ...statsData,
        userId,
        lastUpdated: new Date()
      };

      await this.userStatsCollection!.updateOne(
        { userId },
        { $set: updateData },
        { upsert: true }
      );
      
      console.log(`User stats saved for userId: ${userId}`);
    } catch (error) {
      console.error('Error saving user stats:', error);
      throw error;
    }
  }

  async fetchUserStats(userId: string): Promise<UserStats | null> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return null;
    }

    this.checkConnection();
    
    try {
      const stats = await this.userStatsCollection!.findOne({ userId });
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async updateUserStats(userId: string, statsData: Partial<UserStats>): Promise<void> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return;
    }

    this.checkConnection();
    
    try {
      const updateData = {
        ...statsData,
        lastUpdated: new Date()
      };

      await this.userStatsCollection!.updateOne(
        { userId },
        { $set: updateData },
        { upsert: true }
      );
      
      console.log(`User stats updated for userId: ${userId}`);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Saved Puzzles Functions
  async savePuzzle(userId: string, puzzleData: Omit<SavedPuzzle, 'userId' | 'createdAt' | 'lastPlayed'>): Promise<void> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return;
    }

    this.checkConnection();
    
    try {
      const puzzle: SavedPuzzle = {
        ...puzzleData,
        userId,
        createdAt: new Date(),
        lastPlayed: new Date()
      };

      await this.savedPuzzlesCollection!.insertOne(puzzle);
      console.log(`Puzzle saved for userId: ${userId}, puzzleId: ${puzzleData.puzzleId}`);
    } catch (error) {
      console.error('Error saving puzzle:', error);
      throw error;
    }
  }

  async fetchSavedPuzzles(userId: string): Promise<SavedPuzzle[]> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return [];
    }

    this.checkConnection();
    
    try {
      const puzzles = await this.savedPuzzlesCollection!
        .find({ userId })
        .sort({ lastPlayed: -1 })
        .toArray();
      
      return puzzles;
    } catch (error) {
      console.error('Error fetching saved puzzles:', error);
      throw error;
    }
  }

  // User Reports Functions
  async saveUserReport(userId: string, puzzleId: string, reportType: UserReport['reportType'], reportData: UserReport['reportData']): Promise<void> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return;
    }

    this.checkConnection();
    
    try {
      const report: UserReport = {
        userId,
        puzzleId,
        reportType,
        reportData,
        createdAt: new Date()
      };

      await this.userReportsCollection!.insertOne(report);
      console.log(`User report saved for userId: ${userId}, type: ${reportType}`);
    } catch (error) {
      console.error('Error saving user report:', error);
      throw error;
    }
  }

  async fetchUserReports(userId: string, reportType?: UserReport['reportType']): Promise<UserReport[]> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return [];
    }

    this.checkConnection();
    
    try {
      const filter = reportType ? { userId, reportType } : { userId };
      const reports = await this.userReportsCollection!
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();
      
      return reports;
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  }

  // Completed Puzzles Functions
  async markPuzzleAsSolved(userId: string, puzzleId: string, solveData: Omit<CompletedPuzzle, 'userId' | 'puzzleId' | 'completedAt'>): Promise<void> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return;
    }

    this.checkConnection();
    
    try {
      const completedPuzzle: CompletedPuzzle = {
        ...solveData,
        userId,
        puzzleId,
        completedAt: new Date()
      };

      await this.completedPuzzlesCollection!.insertOne(completedPuzzle);
      
      // Update saved puzzle as completed
      await this.savedPuzzlesCollection!.updateOne(
        { userId, puzzleId },
        { 
          $set: { 
            isCompleted: true,
            solveTime: solveData.solveTime,
            lastPlayed: new Date()
          }
        }
      );
      
      console.log(`Puzzle marked as solved for userId: ${userId}, puzzleId: ${puzzleId}`);
    } catch (error) {
      console.error('Error marking puzzle as solved:', error);
      throw error;
    }
  }

  async fetchCompletedPuzzles(userId: string, difficulty?: string): Promise<CompletedPuzzle[]> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return [];
    }

    this.checkConnection();
    
    try {
      const filter = difficulty ? { userId, difficulty } : { userId };
      const puzzles = await this.completedPuzzlesCollection!
        .find(filter)
        .sort({ completedAt: -1 })
        .toArray();
      
      return puzzles;
    } catch (error) {
      console.error('Error fetching completed puzzles:', error);
      throw error;
    }
  }

  // Leaderboard Functions
  async saveLeaderboardScore(userId: string, username: string, scoreData: Omit<LeaderboardScore, 'userId' | 'username' | 'timestamp'>): Promise<void> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return;
    }

    this.checkConnection();
    
    try {
      const leaderboardScore: LeaderboardScore = {
        ...scoreData,
        userId,
        username,
        timestamp: new Date()
      };

      await this.leaderboardCollection!.insertOne(leaderboardScore);
      console.log(`Leaderboard score saved for userId: ${userId}`);
    } catch (error) {
      console.error('Error saving leaderboard score:', error);
      throw error;
    }
  }

  async fetchLeaderboard(difficulty?: string, technique?: string, limit: number = 50): Promise<LeaderboardScore[]> {
    if (!process.env.ENABLE_MONGO || process.env.ENABLE_MONGO !== 'true') {
      return [];
    }

    this.checkConnection();
    
    try {
      const filter: any = {};
      if (difficulty) filter.difficulty = difficulty;
      if (technique) filter.technique = technique;

      const scores = await this.leaderboardCollection!
        .find(filter)
        .sort({ score: -1, timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return scores;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Utility Functions
  async getConnectionStatus(): Promise<boolean> {
    return this.isConnected;
  }

  async ping(): Promise<boolean> {
    if (!this.isConnected || !this.db) {
      return false;
    }

    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB ping failed:', error);
      return false;
    }
  }

  // Game History Methods
  async saveGameToHistory(gameData: Omit<GameHistory, 'id' | 'datePlayed'>): Promise<GameHistory> {
    if (!this.gameHistoryCollection) {
      throw new Error('Database not connected');
    }

    const newGameHistory: GameHistory = {
      ...gameData,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      datePlayed: new Date()
    };

    await this.gameHistoryCollection.insertOne(newGameHistory);
    return newGameHistory;
  }

  async getUserHistory(userId: string, limit: number = 50): Promise<GameHistory[]> {
    if (!this.gameHistoryCollection) {
      throw new Error('Database not connected');
    }

    return await this.gameHistoryCollection
      .find({ userId })
      .sort({ datePlayed: -1 })
      .limit(limit)
      .toArray();
  }

  async getGameHistoryById(historyId: string): Promise<GameHistory | null> {
    if (!this.gameHistoryCollection) {
      throw new Error('Database not connected');
    }

    return await this.gameHistoryCollection.findOne({ id: historyId });
  }

  // AI Coaching Methods
  async saveAICoachingSession(sessionData: Omit<AICoachingSession, 'id' | 'createdAt' | 'lastUpdated'>): Promise<AICoachingSession> {
    if (!this.aiCoachingCollection) {
      throw new Error('Database not connected');
    }

    const newSession: AICoachingSession = {
      ...sessionData,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    await this.aiCoachingCollection.insertOne(newSession);
    return newSession;
  }

  async getAICoachingSessions(userId: string, limit: number = 20): Promise<AICoachingSession[]> {
    if (!this.aiCoachingCollection) {
      throw new Error('Database not connected');
    }

    return await this.aiCoachingCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Training Recommendations Methods
  async saveTrainingRecommendation(recommendation: Omit<TrainingRecommendation, 'id' | 'createdAt'>): Promise<TrainingRecommendation> {
    if (!this.trainingRecommendationsCollection) {
      throw new Error('Database not connected');
    }

    const newRecommendation: TrainingRecommendation = {
      ...recommendation,
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      createdAt: new Date()
    };

    await this.trainingRecommendationsCollection.insertOne(newRecommendation);
    return newRecommendation;
  }

  async getTrainingRecommendations(userId: string, limit: number = 10): Promise<TrainingRecommendation[]> {
    if (!this.trainingRecommendationsCollection) {
      throw new Error('Database not connected');
    }

    return await this.trainingRecommendationsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
}

// Export singleton instance
export const mongoClient = new MongoClientManager(); 