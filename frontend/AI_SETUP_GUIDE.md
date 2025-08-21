# AI Coaching Setup Guide

## Overview
The Sudoku Master app includes AI-powered coaching features that can provide intelligent hints, step-by-step guidance, and technique explanations. These features are optional and require API keys to function.

## Quick Setup

### 1. Get API Keys (Optional)
To enable full AI coaching features, you'll need an API key from OpenRouter.ai:

#### OpenRouter.ai (Recommended - Unified Gateway)
- Visit: https://openrouter.ai/
- Sign up for a free account
- Navigate to API keys section
- Create a new API key
- Copy the key for use in your environment
- **Benefits**: Single API key for multiple AI models (DeepSeek, Qwen, GPT, Claude, etc.)
- **Cost**: Very affordable, excellent pricing for multiple models

### 2. Environment Configuration
Create a `.env.local` file in your `frontend` directory and add:

```env
# AI API Configuration (Optional)
# OpenRouter.ai - Unified API gateway to multiple AI models
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
```

### 3. Restart Your Development Server
```bash
npm run dev
```

## Features Available

### With API Keys Configured ✨
- **Intelligent Hints**: Context-aware hints based on current puzzle state
- **Step-by-Step Guidance**: Detailed solving strategies
- **Technique Explanations**: In-depth explanations of Sudoku techniques
- **Adaptive Learning**: Hints adjusted to your skill level
- **Puzzle Analysis**: Advanced puzzle difficulty and technique analysis

### Without API Keys (Fallback Mode) 🎯
- **Basic Hints**: General Sudoku solving strategies
- **Static Guidance**: Common techniques and tips
- **Educational Content**: Sudoku rules and basic strategies
- **Still Fully Functional**: The game works perfectly without AI features

## Troubleshooting

### 401 Authentication Error
- Check that your OpenRouter API key is correctly set in `.env.local`
- Ensure the API key is valid and not expired
- Verify you have credits/quota remaining on your OpenRouter account
- Make sure the API key is prefixed with `NEXT_PUBLIC_` for frontend access

### API Rate Limits
- Most free tiers have rate limits
- The app will automatically fall back to basic hints if API calls fail
- Consider upgrading to a paid plan for unlimited usage

### Network Issues
- Check your internet connection
- Verify the API endpoint URL is correct
- Some corporate networks may block AI API calls

## Cost Considerations

- **OpenRouter**: Very affordable, excellent pricing for multiple AI models
- **Free Tiers**: OpenRouter offers generous free tiers suitable for personal use
- **Multiple Models**: Access to DeepSeek, Qwen, GPT, Claude, and more with one API key
- **Usage**: The app makes minimal API calls only when you request hints
- **No Automatic Calls**: AI features only activate when you click the AI Coach button

## Privacy & Security

- OpenRouter API keys are stored locally in your browser environment
- No puzzle data is permanently stored on external servers
- API calls are made directly from your browser to OpenRouter, which then routes to the selected AI model
- OpenRouter provides enterprise-grade security and privacy
- You can disable AI features at any time by removing the API keys

## Alternative Setup

If you prefer not to use OpenRouter or external AI services, you can:

1. **Use the fallback mode**: The app provides helpful static hints
2. **Local AI**: Set up a local AI model (advanced users)
3. **Custom API**: Point to your own AI service endpoint
4. **Direct API access**: Configure individual API keys for specific providers (requires code changes)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your OpenRouter API key configuration
3. Test the API key with a simple curl request to OpenRouter
4. Check OpenRouter dashboard for usage and quota information
5. Contact support with specific error messages

---

**Note**: AI features are entirely optional. The Sudoku Master app is fully functional without any AI configuration!

**OpenRouter Benefits**: 
- Single API key for multiple AI models
- Excellent pricing and generous free tiers
- Enterprise-grade security and privacy
- Unified interface for DeepSeek, Qwen, GPT, Claude, and more
