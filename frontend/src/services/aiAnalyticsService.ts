import { getAIConfig } from '../config/aiConfig';

// Simple ID generator
const generateId = (): string => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export interface PuzzleAnalysis {
  id: string;
  puzzleId: string;
  userId: string;
  completedAt: Date;
  analysis: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    mistakes: {
      type: string;
      count: number;
      description: string;
      technique?: string;
    }[];
    techniquesUsed: {
      name: string;
      successRate: number;
      timeSpent: number;
    }[];
    recommendations: {
      trainingFocus: string[];
      nextPuzzleDifficulty: string;
      specificTechniques: string[];
    };
    performanceInsights: {
      timeManagement: string;
      accuracy: string;
      techniqueEfficiency: string;
      improvementAreas: string[];
    };
  };
}

export interface TrainingRecommendation {
  id: string;
  userId: string;
  basedOnAnalysis: string;
  recommendedPuzzles: {
    difficulty: string;
    techniques: string[];
    estimatedTime: number;
    reasoning: string;
  }[];
  skillGaps: string[];
  improvementPlan: string[];
}

export interface AnalyticsRequest {
  puzzle: number[][];
  solution: number[][];
  userMoves: {
    row: number;
    col: number;
    value: number;
    timestamp: number;
    wasCorrect: boolean;
  }[];
  difficulty: string;
  solveTime: number;
  hintsUsed: number;
  mistakes: number;
  techniquesAttempted: string[];
}

export interface AnalyticsResponse {
  analysis: PuzzleAnalysis;
  recommendations: TrainingRecommendation;
  insights: string[];
  nextSteps: string[];
}

class AIAnalyticsService {
  private config: ReturnType<typeof getAIConfig>;

  constructor() {
    this.config = getAIConfig();
  }

  private async callQwenAPI(prompt: string): Promise<string> {
    if (!this.config.qwen.apiKey) {
      throw new Error('Qwen API key not configured');
    }

    try {
      const response = await fetch(this.config.qwen.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.qwen.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.qwen.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert Sudoku analyst and coach. Your role is to:
1. Analyze completed Sudoku puzzles for performance insights
2. Identify strengths and weaknesses in solving approaches
3. Detect patterns in mistakes and technique usage
4. Generate personalized training recommendations
5. Provide actionable feedback for improvement
6. Reference standard Sudoku techniques from hodoku.sourceforge.net

Be analytical, constructive, and specific in your recommendations.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      console.error('Error calling Qwen API:', error);
      throw error;
    }
  }

  async analyzePuzzle(request: AnalyticsRequest): Promise<AnalyticsResponse> {
    const prompt = this.buildAnalysisPrompt(request);
    const aiResponse = await this.callQwenAPI(prompt);
    
    return this.parseAnalysisResponse(aiResponse, request);
  }

  async generateTrainingRecommendations(userId: string, recentAnalyses: PuzzleAnalysis[]): Promise<TrainingRecommendation> {
    const prompt = this.buildRecommendationPrompt(recentAnalyses);
    const aiResponse = await this.callQwenAPI(prompt);
    
    return this.parseRecommendationResponse(aiResponse, userId, recentAnalyses);
  }

  async analyzeTechniqueUsage(technique: string, userPerformance: any[]): Promise<any> {
    const prompt = `Analyze the user's performance with the "${technique}" technique based on this data:
    ${JSON.stringify(userPerformance, null, 2)}
    
    Provide insights on:
    1. Success rate and consistency
    2. Common mistakes when using this technique
    3. Time efficiency
    4. Areas for improvement
    5. Related techniques to practice`;
    
    const aiResponse = await this.callQwenAPI(prompt);
    return this.parseTechniqueAnalysis(aiResponse, technique);
  }

  private buildAnalysisPrompt(request: AnalyticsRequest): string {
    const { puzzle, solution, userMoves, difficulty, solveTime, hintsUsed, mistakes, techniquesAttempted } = request;
    
    return `Analyze this completed Sudoku puzzle for a player:

Original Puzzle:
${this.formatGrid(puzzle)}

Solution:
${this.formatGrid(solution)}

User Performance:
- Difficulty: ${difficulty}
- Solve Time: ${solveTime} seconds
- Hints Used: ${hintsUsed}
- Mistakes Made: ${mistakes}
- Techniques Attempted: ${techniquesAttempted.join(', ')}

User Moves (chronological):
${userMoves.map((move, index) => 
  `${index + 1}. Row ${move.row + 1}, Col ${move.col + 1}: ${move.value} ${move.wasCorrect ? '(correct)' : '(incorrect)'}`
).join('\n')}

Provide a comprehensive analysis including:
1. Overall performance score (0-100)
2. Key strengths demonstrated
3. Areas of weakness
4. Specific mistakes and their causes
5. Technique usage effectiveness
6. Time management insights
7. Specific training recommendations
8. Next puzzle difficulty suggestion

Format your response as structured analysis data.`;
  }

  private buildRecommendationPrompt(analyses: PuzzleAnalysis[]): string {
    const recentAnalyses = analyses.slice(-5); // Last 5 analyses
    
    return `Based on these recent puzzle analyses, generate personalized training recommendations:

${recentAnalyses.map(analysis => `
Puzzle ${analysis.puzzleId}:
- Score: ${analysis.analysis.overallScore}/100
- Strengths: ${analysis.analysis.strengths.join(', ')}
- Weaknesses: ${analysis.analysis.weaknesses.join(', ')}
- Techniques: ${analysis.analysis.techniquesUsed.map(t => t.name).join(', ')}
`).join('\n')}

Generate:
1. Specific training focus areas
2. Recommended puzzle difficulties
3. Techniques to practice
4. Improvement timeline
5. Success metrics to track

Be specific and actionable in your recommendations.`;
  }

  private formatGrid(grid: number[][]): string {
    return grid.map(row => row.map(cell => cell === 0 ? '.' : cell.toString()).join(' ')).join('\n');
  }

  private parseAnalysisResponse(aiResponse: string, request: AnalyticsRequest): AnalyticsResponse {
    // Parse the AI response and extract structured information
    const analysis: PuzzleAnalysis = {
      id: generateId(),
      puzzleId: request.puzzle.toString(), // Simplified for now
      userId: 'user', // Will be set by caller
      completedAt: new Date(),
      analysis: {
        overallScore: this.extractScore(aiResponse),
        strengths: this.extractStrengths(aiResponse),
        weaknesses: this.extractWeaknesses(aiResponse),
        mistakes: this.extractMistakes(aiResponse),
        techniquesUsed: this.extractTechniquesUsed(aiResponse),
        recommendations: {
          trainingFocus: this.extractTrainingFocus(aiResponse),
          nextPuzzleDifficulty: this.extractNextDifficulty(aiResponse),
          specificTechniques: this.extractSpecificTechniques(aiResponse)
        },
        performanceInsights: {
          timeManagement: this.extractTimeInsight(aiResponse),
          accuracy: this.extractAccuracyInsight(aiResponse),
          techniqueEfficiency: this.extractTechniqueInsight(aiResponse),
          improvementAreas: this.extractImprovementAreas(aiResponse)
        }
      }
    };

    const recommendations: TrainingRecommendation = {
      id: generateId(),
      userId: 'user', // Will be set by caller
      basedOnAnalysis: analysis.id,
      recommendedPuzzles: this.extractRecommendedPuzzles(aiResponse),
      skillGaps: this.extractSkillGaps(aiResponse),
      improvementPlan: this.extractImprovementPlan(aiResponse)
    };

    return {
      analysis,
      recommendations,
      insights: this.extractInsights(aiResponse),
      nextSteps: this.extractNextSteps(aiResponse)
    };
  }

  private parseRecommendationResponse(aiResponse: string, userId: string, analyses: PuzzleAnalysis[]): TrainingRecommendation {
    return {
      id: generateId(),
      userId,
      basedOnAnalysis: analyses[analyses.length - 1]?.id || '',
      recommendedPuzzles: this.extractRecommendedPuzzles(aiResponse),
      skillGaps: this.extractSkillGaps(aiResponse),
      improvementPlan: this.extractImprovementPlan(aiResponse)
    };
  }

  private parseTechniqueAnalysis(aiResponse: string, technique: string): any {
    return {
      technique,
      analysis: aiResponse,
      insights: this.extractInsights(aiResponse),
      recommendations: this.extractImprovementPlan(aiResponse)
    };
  }

  // Helper methods to extract information from AI responses
  private extractScore(text: string): number {
    const scoreMatch = text.match(/score[:\s]+(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 75;
  }

  private extractStrengths(text: string): string[] {
    const strengths: string[] = [];
    const strengthPattern = /strength[s]?[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = strengthPattern.exec(text)) !== null) {
      strengths.push(match[1].trim());
    }
    
    return strengths.length > 0 ? strengths : ['Good basic solving skills'];
  }

  private extractWeaknesses(text: string): string[] {
    const weaknesses: string[] = [];
    const weaknessPattern = /weakness[es]?[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = weaknessPattern.exec(text)) !== null) {
      weaknesses.push(match[1].trim());
    }
    
    return weaknesses.length > 0 ? weaknesses : ['Could improve technique recognition'];
  }

  private extractMistakes(text: string): any[] {
    // Simplified mistake extraction
    return [{
      type: 'general',
      count: 1,
      description: 'Mistakes detected in solving approach',
      technique: 'general'
    }];
  }

  private extractTechniquesUsed(text: string): any[] {
    const techniques: any[] = [];
    const techniquePattern = /technique[s]?[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = techniquePattern.exec(text)) !== null) {
      techniques.push({
        name: match[1].trim(),
        successRate: 80,
        timeSpent: 30
      });
    }
    
    return techniques.length > 0 ? techniques : [{
      name: 'Basic solving',
      successRate: 75,
      timeSpent: 60
    }];
  }

  private extractTrainingFocus(text: string): string[] {
    const focus: string[] = [];
    const focusPattern = /focus[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = focusPattern.exec(text)) !== null) {
      focus.push(match[1].trim());
    }
    
    return focus.length > 0 ? focus : ['Technique recognition'];
  }

  private extractNextDifficulty(text: string): string {
    const difficultyMatch = text.match(/difficulty[:\s]+(\w+)/i);
    return difficultyMatch ? difficultyMatch[1] : 'medium';
  }

  private extractSpecificTechniques(text: string): string[] {
    const techniques: string[] = [];
    const techniquePattern = /practice\s+([^.]+)/gi;
    let match;
    
    while ((match = techniquePattern.exec(text)) !== null) {
      techniques.push(match[1].trim());
    }
    
    return techniques;
  }

  private extractTimeInsight(text: string): string {
    const timeMatch = text.match(/time[:\s]+([^.]+)/i);
    return timeMatch ? timeMatch[1].trim() : 'Time management could be improved';
  }

  private extractAccuracyInsight(text: string): string {
    const accuracyMatch = text.match(/accuracy[:\s]+([^.]+)/i);
    return accuracyMatch ? accuracyMatch[1].trim() : 'Accuracy is good but could improve';
  }

  private extractTechniqueInsight(text: string): string {
    const techniqueMatch = text.match(/technique[:\s]+([^.]+)/i);
    return techniqueMatch ? techniqueMatch[1].trim() : 'Technique usage is developing';
  }

  private extractImprovementAreas(text: string): string[] {
    const areas: string[] = [];
    const areaPattern = /improve[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = areaPattern.exec(text)) !== null) {
      areas.push(match[1].trim());
    }
    
    return areas.length > 0 ? areas : ['General technique recognition'];
  }

  private extractRecommendedPuzzles(text: string): any[] {
    return [{
      difficulty: 'medium',
      techniques: ['basic solving'],
      estimatedTime: 300,
      reasoning: 'Based on current skill level'
    }];
  }

  private extractSkillGaps(text: string): string[] {
    return ['Technique recognition', 'Pattern identification'];
  }

  private extractImprovementPlan(text: string): string[] {
    return ['Practice basic techniques', 'Focus on pattern recognition'];
  }

  private extractInsights(text: string): string[] {
    const insights: string[] = [];
    const insightPattern = /insight[s]?[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = insightPattern.exec(text)) !== null) {
      insights.push(match[1].trim());
    }
    
    return insights.length > 0 ? insights : ['Continue practicing regularly'];
  }

  private extractNextSteps(text: string): string[] {
    const steps: string[] = [];
    const stepPattern = /next[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = stepPattern.exec(text)) !== null) {
      steps.push(match[1].trim());
    }
    
    return steps.length > 0 ? steps : ['Practice the recommended techniques'];
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
export default aiAnalyticsService;
