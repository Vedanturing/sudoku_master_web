import { getAIConfig } from '../config/aiConfig';

// Simple ID generator
const generateId = (): string => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

export interface TeachingHint {
  id: string;
  type: 'rule' | 'technique' | 'strategy' | 'step';
  message: string;
  technique?: string;
  examples?: string[];
  hodokuReference?: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
}

export interface TeachingSession {
  id: string;
  userId: string;
  puzzleId: string;
  hints: TeachingHint[];
  currentStep: number;
  totalSteps: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface TeachingRequest {
  puzzle: number[][];
  currentState: number[][];
  difficulty: string;
  userLevel: 'beginner' | 'intermediate' | 'expert';
  specificQuestion?: string;
  technique?: string;
}

export interface TeachingResponse {
  hint: TeachingHint;
  nextStep?: string;
  explanation: string;
  relatedTechniques: string[];
  practiceSuggestion?: string;
}

class AITeachingService {
  private config: ReturnType<typeof getAIConfig>;

  constructor() {
    this.config = getAIConfig();
  }

  private async callDeepseekAPI(prompt: string): Promise<string> {
    if (!this.config.deepseek.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    try {
      const response = await fetch(this.config.deepseek.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.deepseek.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.deepseek.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert Sudoku coach and teacher. Your role is to:
1. Explain Sudoku rules, techniques, and strategies clearly
2. Guide users step-by-step through puzzle solving
3. Provide hints in an easy-to-understand way with examples
4. Reference techniques using standard naming conventions from hodoku.sourceforge.net
5. Adapt your teaching style to the user's level (beginner/intermediate/expert)
6. Always be encouraging and supportive

Use clear, concise language and provide practical examples when possible.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      throw error;
    }
  }

  async getHint(request: TeachingRequest): Promise<TeachingResponse> {
    const prompt = this.buildHintPrompt(request);
    const aiResponse = await this.callDeepseekAPI(prompt);
    
    return this.parseHintResponse(aiResponse, request);
  }

  async explainTechnique(technique: string, userLevel: 'beginner' | 'intermediate' | 'expert'): Promise<TeachingResponse> {
    const prompt = `Explain the Sudoku technique "${technique}" for a ${userLevel} level player. 
    Include:
    1. What the technique is and when to use it
    2. Step-by-step how to apply it
    3. A simple example
    4. Reference to hodoku.sourceforge.net if applicable
    5. Common mistakes to avoid
    
    Keep the explanation appropriate for ${userLevel} level.`;

    const aiResponse = await this.callDeepseekAPI(prompt);
    
    return this.parseTechniqueExplanation(aiResponse, technique, userLevel);
  }

  async getStepByStepGuidance(puzzle: number[][], currentState: number[][], userLevel: 'beginner' | 'intermediate' | 'expert'): Promise<TeachingResponse[]> {
    const prompt = `Analyze this Sudoku puzzle and provide step-by-step guidance for a ${userLevel} level player.
    
    Current puzzle state:
    ${this.formatGrid(currentState)}
    
    Original puzzle:
    ${this.formatGrid(puzzle)}
    
    Provide 3-5 logical next steps with explanations. Each step should:
    1. Identify what to look for
    2. Explain the reasoning
    3. Show the specific action to take
    4. Mention any relevant techniques
    
    Format as numbered steps.`;

    const aiResponse = await this.callDeepseekAPI(prompt);
    
    return this.parseStepByStepResponse(aiResponse, userLevel);
  }

  private buildHintPrompt(request: TeachingRequest): string {
    const { puzzle, currentState, difficulty, userLevel, specificQuestion, technique } = request;
    
    let prompt = `You are helping a ${userLevel} level Sudoku player solve a ${difficulty} puzzle.
    
    Original puzzle:
    ${this.formatGrid(puzzle)}
    
    Current state:
    ${this.formatGrid(currentState)}
    
    ${specificQuestion ? `The player has a specific question: ${specificQuestion}` : ''}
    ${technique ? `Focus on the technique: ${technique}` : ''}
    
    Provide a helpful hint that:
    1. Is appropriate for ${userLevel} level
    2. Guides without giving away the answer
    3. Explains the reasoning
    4. References relevant Sudoku techniques
    5. Is encouraging and supportive
    
    Keep the hint concise but educational.`;

    return prompt;
  }

  private formatGrid(grid: number[][]): string {
    return grid.map(row => row.map(cell => cell === 0 ? '.' : cell.toString()).join(' ')).join('\n');
  }

  private parseHintResponse(aiResponse: string, request: TeachingRequest): TeachingResponse {
    // Parse the AI response and extract structured information
    const hint: TeachingHint = {
      id: generateId(),
      type: 'strategy',
      message: aiResponse,
      difficulty: request.userLevel,
      technique: this.extractTechnique(aiResponse),
      examples: this.extractExamples(aiResponse),
      hodokuReference: this.extractHodokuReference(aiResponse)
    };

    return {
      hint,
      explanation: aiResponse,
      relatedTechniques: this.extractRelatedTechniques(aiResponse),
      practiceSuggestion: this.extractPracticeSuggestion(aiResponse)
    };
  }

  private parseTechniqueExplanation(aiResponse: string, technique: string, userLevel: 'beginner' | 'intermediate' | 'expert'): TeachingResponse {
    const hint: TeachingHint = {
      id: generateId(),
      type: 'technique',
      message: aiResponse,
      difficulty: userLevel,
      technique,
      examples: this.extractExamples(aiResponse),
      hodokuReference: this.extractHodokuReference(aiResponse)
    };

    return {
      hint,
      explanation: aiResponse,
      relatedTechniques: this.extractRelatedTechniques(aiResponse),
      practiceSuggestion: this.extractPracticeSuggestion(aiResponse)
    };
  }

  private parseStepByStepResponse(aiResponse: string, userLevel: 'beginner' | 'intermediate' | 'expert'): TeachingResponse[] {
    // Parse numbered steps from the AI response
    const steps = aiResponse.split(/\d+\./).filter(step => step.trim().length > 0);
    
    return steps.map((step, index) => {
      const hint: TeachingHint = {
        id: generateId(),
        type: 'step',
        message: step.trim(),
        difficulty: userLevel,
        technique: this.extractTechnique(step)
      };

      return {
        hint,
        explanation: step.trim(),
        relatedTechniques: this.extractRelatedTechniques(step)
      };
    });
  }

  private extractTechnique(text: string): string | undefined {
    const techniquePatterns = [
      /naked\s+(single|pair|triple|quad)/i,
      /hidden\s+(single|pair|triple|quad)/i,
      /x-wing/i,
      /y-wing/i,
      /swordfish/i,
      /jellyfish/i,
      /xy-wing/i,
      /xyz-wing/i,
      /remote\s+pairs/i,
      /unique\s+rectangle/i,
      /bivalue\s+universal\s+grave/i,
      /forcing\s+chain/i,
      /coloring/i,
      /skyscraper/i,
      /two-string\s+kite/i,
      /turbot\s+fish/i
    ];

    for (const pattern of techniquePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].toLowerCase();
      }
    }

    return undefined;
  }

  private extractExamples(text: string): string[] {
    // Extract examples from the text (simplified parsing)
    const examples: string[] = [];
    const examplePattern = /example[s]?[:\s]+([^.]+)/gi;
    let match;
    
    while ((match = examplePattern.exec(text)) !== null) {
      examples.push(match[1].trim());
    }

    return examples;
  }

  private extractHodokuReference(text: string): string | undefined {
    const hodokuPattern = /hodoku\.sourceforge\.net[^\s]*/i;
    const match = text.match(hodokuPattern);
    return match ? match[0] : undefined;
  }

  private extractRelatedTechniques(text: string): string[] {
    const techniques = this.extractTechnique(text);
    if (!techniques) return [];

    // Return related techniques based on the main technique
    const techniqueRelations: Record<string, string[]> = {
      'naked single': ['hidden single', 'pointing pairs'],
      'naked pair': ['hidden pair', 'pointing pairs'],
      'x-wing': ['y-wing', 'swordfish', 'jellyfish'],
      'y-wing': ['xyz-wing', 'forcing chain'],
      'swordfish': ['x-wing', 'jellyfish', 'xy-wing']
    };

    return techniqueRelations[techniques] || [];
  }

  private extractPracticeSuggestion(text: string): string | undefined {
    const practicePatterns = [
      /practice\s+([^.]+)/i,
      /try\s+([^.]+)/i,
      /focus\s+on\s+([^.]+)/i
    ];

    for (const pattern of practicePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }
}

export const aiTeachingService = new AITeachingService();
export default aiTeachingService;
