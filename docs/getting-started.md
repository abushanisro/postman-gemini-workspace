# Getting Started with Gemini API Postman Workspace

Welcome to the comprehensive Postman workspace for Google's Gemini APIs! This workspace provides everything you need to explore, test and integrate with Gemini's powerful AI capabilities.

## Quick Start

### Prerequisites

1. **Google AI Studio Account**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Postman**: Download from [postman.com](https://www.postman.com/downloads/)
3. **Node.js** (optional): Required for mock server and automation scripts

### Installation

1. **Import the Workspace**
   - Download all JSON files from the `collections/` directory
   - In Postman, click "Import" and select the collection files
   - Import the environment files from `environments/`

2. **Configure Environment**
   - Select either "Gemini API - Development" or "Gemini API - Production" environment
   - Set your `GEMINI_API_KEY` variable with your actual API key
   - Verify other environment variables match your setup

3. **Test Connection**
   - Run the "API Connectivity Test" from the Health Check folder
   - Verify you get a 200 response with available models

## Workspace Structure

### Collections Overview

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| **Text Generation** | Basic text generation and completion | Multiple temperature settings, system instructions, streaming |
| **Chat & Conversation** | Multi-turn conversations | Context management, function calling, conversation history |
| **Vision & Image Analysis** | Image understanding and analysis | OCR, UI analysis, multi-image comparison |
| **Code Generation** | Programming assistance | Code generation, debugging, testing, documentation |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google AI Studio API key | `AIza...` |
| `base_url` | Gemini API base URL | `https://generativelanguage.googleapis.com` |
| `model_name` | Default text model | `gemini-1.5-pro` |
| `vision_model_name` | Model for image tasks | `gemini-1.5-pro` |

## Common Use Cases

### 1. Simple Text Generation

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Write a brief explanation of machine learning"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
```

### 2. Chat with Context

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Hello, I'm learning to code"}]
    },
    {
      "role": "model",
      "parts": [{"text": "Great! What programming language interests you?"}]
    },
    {
      "role": "user",
      "parts": [{"text": "Python. Can you help me with basics?"}]
    }
  ]
}
```

### 3. Image Analysis

```json
{
  "contents": [
    {
      "parts": [
        {"text": "Describe this image in detail"},
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "base64_encoded_image_data"
          }
        }
      ]
    }
  ]
}
```

## Configuration Guide

### Temperature Settings

- **0.0-0.3**: Factual, consistent responses (documentation, analysis)
- **0.4-0.7**: Balanced creativity and accuracy (general use)
- **0.8-1.2**: Creative, diverse outputs (brainstorming, creative writing)
- **1.3-2.0**: Highly creative, experimental (artistic content)

### Safety Settings

```json
{
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

### Token Limits

| Model | Input Limit | Output Limit |
|-------|-------------|--------------|
| Gemini 1.5 Pro | 1M tokens | 8K tokens |
| Gemini 1.5 Flash | 1M tokens | 8K tokens |

## Testing Features

### Built-in Tests

Each request includes comprehensive test scripts that validate:
- Response structure and format
- Content quality and relevance
- Error handling
- Performance metrics
- Safety ratings

### Running Tests

1. **Individual Request**: Click "Send" to run request with tests
2. **Collection Runner**: Use Postman's Collection Runner for batch testing
3. **Newman CLI**: Run tests programmatically

```bash
newman run collections/gemini-api-collection.json -e environments/development.json
```

### Mock Server

For local development without API costs:

```bash
npm run mock
# Server starts on http://localhost:3000
```

Then set `base_url` environment variable to `http://localhost:3000`.

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Verify `GEMINI_API_KEY` is set correctly
   - Check API key has necessary permissions
   - Ensure key hasn't expired

2. **400 Bad Request**
   - Validate JSON structure
   - Check required fields are present
   - Verify parameter values are within valid ranges

3. **429 Rate Limited**
   - Implement request delays
   - Use exponential backoff
   - Consider upgrading API quota

4. **Content Blocked**
   - Adjust safety settings
   - Modify prompt to be less sensitive
   - Review content guidelines

### Debug Mode

Enable debug logging by setting `debug_mode: true` in your environment. This provides:
- Detailed request/response logging
- Token usage information
- Performance metrics
- Error context

## Next Steps

1. **Explore Collections**: Try different request types in each collection
2. **Customize Parameters**: Experiment with temperature, top_k, and top_p
3. **Build Workflows**: Chain requests together for complex tasks
4. **Monitor Usage**: Track token consumption and response times
5. **Read Advanced Guide**: Check `docs/advanced-usage.md` for power user features

## Support

- **Documentation**: See `docs/` folder for detailed guides
- **Issues**: Check existing requests for similar problems
- **Community**: Join Postman and Google AI communities
- **API Reference**: [Gemini API Documentation](https://ai.google.dev/docs)

---

Happy testing with Gemini APIs!