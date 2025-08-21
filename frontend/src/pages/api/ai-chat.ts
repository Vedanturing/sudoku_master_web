import type { NextApiRequest, NextApiResponse } from 'next';
import { getAIConfig } from '../../config/aiConfig';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userLevel, difficulty } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const config = getAIConfig();
    
    if (!config.openrouter.apiKey) {
      // Return fallback response when no API key is configured
      return res.status(200).json({
        response: `I'd be happy to help you with your Sudoku question! Since I'm currently in fallback mode, here are some general tips:

🔍 **For Technique Questions**: Look for patterns like naked singles, hidden singles, and pairs
📚 **For Learning**: Practice with easier puzzles first, then gradually increase difficulty
⏱️ **For Speed**: Focus on accuracy before speed - good technique leads to faster solving
🎯 **For Specific Help**: Try asking about specific techniques like "What is a naked single?" or "How do I find hidden pairs?"

What specific aspect of Sudoku would you like to learn more about?`
      });
    }

    // Call OpenRouter API
    const response = await fetch(config.openrouter.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'http://localhost:3000',
        'X-Title': 'Sudoku Master'
      },
      body: JSON.stringify({
        model: config.openrouter.models.deepseek,
        messages: [
          {
            role: 'system',
            content: `You are an expert Sudoku coach having a conversation with a student. 

Current context:
- User level: ${userLevel || 'beginner'}
- Current difficulty: ${difficulty || 'medium'}
- User just asked: "${message}"

Please provide a helpful, conversational response that:
1. Answers their question directly and clearly
2. Uses examples when helpful
3. Suggests related techniques to practice
4. Encourages learning and practice
5. Adapts to their skill level
6. References standard Sudoku terminology from hodoku.sourceforge.net

Keep your response conversational but educational. If they're asking about a specific technique, explain it with examples. If they're asking for general advice, provide actionable tips.`
          },
          {
            role: 'user',
            content: message
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
    const aiResponse = data.choices[0]?.message?.content || 'No response from AI';

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    // Return a helpful fallback response
    return res.status(200).json({
      response: `I apologize, but I'm having trouble responding right now. Here are some general Sudoku tips to help you:

🔍 **Basic Techniques**: Start with naked singles and hidden singles
📚 **Practice**: Work on easier puzzles to build confidence
⏱️ **Patience**: Take your time to understand each technique
🎯 **Focus**: Look for patterns in rows, columns, and 3x3 boxes

Please try asking your question again, or check your internet connection.`
    });
  }
}
