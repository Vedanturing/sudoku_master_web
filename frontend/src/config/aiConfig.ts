// AI Configuration
export interface AIConfig {
  deepseek: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  qwen: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
}

// Get AI configuration from environment variables
export function getAIConfig(): AIConfig {
  return {
    deepseek: {
      apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
      baseUrl: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek/deepseek-r1:free'
    },
    qwen: {
      apiKey: process.env.NEXT_PUBLIC_QWEN_API_KEY || '',
      baseUrl: process.env.NEXT_PUBLIC_QWEN_API_URL || 'https://api.qwen.ai/v1/chat/completions',
      model: 'qwen/qwen-2.5-72b-instruct:free'
    }
  };
}
