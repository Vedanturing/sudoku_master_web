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

  private async callOpenRouterAPI(prompt: string, modelType: 'deepseek' | 'qwen' = 'deepseek'): Promise<string> {
    if (!this.config.openrouter.apiKey) {
      console.warn('OpenRouter API key not configured. Using fallback hints.');
      return this.getFallbackHint(prompt);
    }

    try {
      const response = await fetch(this.config.openrouter.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Sudoku Master'
        },
        body: JSON.stringify({
          model: this.config.openrouter.models[modelType],
          messages: [
            {
                                role: 'system',
                  content: `You are an expert Sudoku coach and teacher with deep knowledge of all solving techniques. Your role is to:

1. PROVIDE SPECIFIC, ACTIONABLE HINTS:
   - Don't just explain concepts - tell the user exactly what to look for
   - Point to specific cells, rows, columns, or boxes
   - Give step-by-step instructions when appropriate

2. ADAPT TO USER LEVEL:
   - Beginner: Focus on basic techniques (naked singles, hidden singles)
   - Intermediate: Introduce pairs, triples, and basic patterns
   - Expert: Advanced techniques like X-Wing, Swordfish, XY-Wing

3. USE CLEAR, VISUAL LANGUAGE:
   - Reference specific grid positions (e.g., "Look at row 3, column 7")
   - Use visual cues ("Look for numbers that can only go in one place")
   - Provide concrete examples

4. REFERENCE STANDARD TECHNIQUES:
   - Use official technique names from hodoku.sourceforge.net
   - Explain why a technique works, not just how to use it
   - Connect techniques to broader solving strategies

5. ENCOURAGE LEARNING:
   - Explain the reasoning behind your hints
   - Suggest what to practice next
   - Build confidence through understanding

6. BE SPECIFIC AND PRACTICAL:
   - Avoid vague advice like "look for patterns"
   - Give concrete, actionable guidance
   - Help the user develop systematic solving approaches

Remember: Your goal is to teach, not just give answers. Help the user understand WHY your hint works and HOW to apply similar logic in the future.`
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
        throw new Error(`OpenRouter API call failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from AI';
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  async getHint(request: TeachingRequest): Promise<TeachingResponse> {
    const prompt = this.buildHintPrompt(request);
    const aiResponse = await this.callOpenRouterAPI(prompt, 'deepseek');
    
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

    const aiResponse = await this.callOpenRouterAPI(prompt, 'deepseek');
    
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

    const aiResponse = await this.callOpenRouterAPI(prompt, 'deepseek');
    
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

  private getFallbackHint(prompt: string): string {
    // Provide helpful fallback hints when API is not configured
    const fallbackHints = [
      {
        keywords: ['beginner', 'easy', 'start'],
        hint: "🔍 **Basic Strategy Tip:** Look for cells that can only contain one number. These are called 'Naked Singles' - when only one number can fit in a cell based on the row, column, and 3x3 box constraints."
      },
      {
        keywords: ['hint', 'help', 'stuck'],
        hint: "💡 **General Solving Tip:** Start by looking for the easiest moves first:\n1. Find cells with only one possible number\n2. Look for numbers that can only go in one place in a row, column, or box\n3. Use pencil marks to track possibilities\n4. Focus on rows, columns, or boxes that are almost complete"
      },
      {
        keywords: ['intermediate', 'medium'],
        hint: "🎯 **Intermediate Strategy:** Try using 'Hidden Singles' - look for a number that can only be placed in one cell within a row, column, or 3x3 box, even if that cell has other candidates."
      },
      {
        keywords: ['advanced', 'expert', 'difficult'],
        hint: "🚀 **Advanced Technique:** Consider using 'Naked Pairs' or 'Hidden Pairs'. When two cells in the same row/column/box can only contain the same two numbers, you can eliminate those numbers from other cells in that unit."
      },
      {
        keywords: ['technique', 'strategy', 'method'],
        hint: "📚 **Sudoku Techniques:** The most common solving techniques are:\n• Naked/Hidden Singles\n• Naked/Hidden Pairs\n• Pointing Pairs/Triples\n• Box/Line Reduction\n• X-Wing\n• Y-Wing\n\nStart with simpler techniques and progress to more advanced ones."
      }
    ];

    // Find the most relevant fallback hint
    const promptLower = prompt.toLowerCase();
    for (const fallback of fallbackHints) {
      if (fallback.keywords.some(keyword => promptLower.includes(keyword))) {
        return fallback.hint;
      }
    }

    // Default fallback hint
    return "🎲 **AI Coach Unavailable:** The AI coaching feature requires API configuration. In the meantime, try these general tips:\n\n• Look for cells with only one possible number\n• Find numbers that can only go in one specific place\n• Use the process of elimination\n• Focus on completing rows, columns, or boxes that are nearly full\n• Take breaks and come back with fresh eyes!\n\n*To enable full AI coaching, please configure the DeepSeek API key in your environment settings.*";
  }
}

export const aiTeachingService = new AITeachingService();
export default aiTeachingService;
