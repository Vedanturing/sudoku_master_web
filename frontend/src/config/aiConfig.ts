// AI Configuration
export interface AIConfig {
  openrouter: {
    apiKey: string;
    baseUrl: string;
    models: {
      deepseek: string;
      qwen: string;
    };
  };
}

// Get AI configuration from environment variables
export function getAIConfig(): AIConfig {
  return {
    openrouter: {
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
      baseUrl: process.env.NEXT_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
      models: {
        deepseek: 'deepseek/deepseek-r1:free',
        qwen: 'qwen/qwen-2.5-72b-instruct:free'
      }
    }
  };
}
