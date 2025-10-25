# Gemini API Postman Workspace

A comprehensive Postman workspace for exploring, testing, and integrating with Google's Gemini APIs. This workspace provides pre-built collections, environments, tests, documentation, and automation tools to streamline your AI development workflow.

[![Validation](https://github.com/your-username/postman-gemini-workspace/actions/workflows/update-workspace.yml/badge.svg)](https://github.com/your-username/postman-gemini-workspace/actions/workflows/update-workspace.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Postman](https://img.shields.io/badge/Postman-Collection-orange)](collections/)

## Quick Start

### 1. Get Your API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Keep it secure - you'll need it for authentication

### 2. Import to Postman
1. Download this repository
2. Open Postman
3. Click **Import** and select the collection files from `collections/`
4. Import the environment files from `environments/`

### 3. Configure Environment
1. Select "Gemini API - Development" environment
2. Set your `GEMINI_API_KEY` variable
3. Run the "API Connectivity Test" to verify setup

### 4. Start Exploring
- Try text generation requests
- Explore chat and conversation flows
- Test image analysis capabilities
- Generate and review code

## Workspace Structure

```
postman-gemini-workspace/
├── collections/           # Postman collection files
│   ├── gemini-api-collection.json
│   ├── text-generation.json
│   ├── chat-conversation.json
│   ├── vision-image-analysis.json
│   └── code-generation.json
├── environments/          # Environment configurations
│   ├── development.json
│   ├── production.json
│   └── .env.example
├── tests/                # Test scripts and validation
│   ├── api-validation-tests.js
│   └── collection-tests.json
├── mocks/                # Mock server for local development
│   └── gemini-mock-server.js
├── scripts/              # Automation and utility scripts
│   ├── validate-collections.js
│   ├── start-mock-server.js
│   ├── check-api-updates.js
│   └── update-workspace.js
├── docs/                 # Documentation
│   ├── getting-started.md
│   ├── advanced-usage.md
│   └── api-reference.md
└── .github/workflows/    # CI/CD automation
    └── update-workspace.yml
```

## Features

### Collections

| Collection | Requests | Purpose |
|------------|----------|---------|
| **Text Generation** | 6 | Basic text generation with various parameters |
| **Chat & Conversation** | 6 | Multi-turn conversations and context management |
| **Vision & Image Analysis** | 7 | Image understanding and visual Q&A |
| **Code Generation** | 7 | Programming assistance and code review |

### Key Capabilities

- Complete API Coverage: All major Gemini API endpoints
- Production Ready: Proper error handling and validation
- Multiple Environments: Development and production configurations
- Comprehensive Testing: Built-in test scripts and validation
- Mock Server: Local development without API costs
- Auto-Updates: GitHub Actions for maintenance
- Rich Documentation: Getting started guides and API reference

## Use Cases

### Content Creation
- Blog post generation
- Creative writing assistance
- Marketing copy creation
- Social media content

### Code Development
- Code generation and completion
- Bug detection and fixing
- Code review and optimization
- Documentation generation

### Image Analysis
- Content moderation
- Accessibility descriptions
- Visual question answering
- UI/UX analysis

### Chat Applications
- Customer support bots
- Educational assistants
- Interactive help systems
- Conversational interfaces

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google AI Studio API key | `AIza...` |
| `base_url` | Gemini API base URL | `https://generativelanguage.googleapis.com` |
| `api_version` | API version to use | `v1beta` |

### Model Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `model_name` | `gemini-1.5-pro` | Default text model |
| `vision_model_name` | `gemini-1.5-pro` | Vision tasks model |
| `chat_model_name` | `gemini-1.5-pro` | Chat model |
| `code_model_name` | `gemini-1.5-pro` | Code generation model |

### Performance Settings

| Variable | Development | Production |
|----------|-------------|------------|
| `request_timeout` | 30000ms | 60000ms |
| `rate_limit_requests_per_minute` | 60 | 300 |
| `default_temperature` | 0.7 | 0.3 |
| `safety_threshold` | `BLOCK_MEDIUM_AND_ABOVE` | `BLOCK_LOW_AND_ABOVE` |

## Testing

### Running Tests

```bash
# Install dependencies
npm install

# Validate collections
npm run validate

# Run API tests
npm run test

# Run tests against production
npm run test:prod
```

### Mock Server

Start the local mock server for development:

```bash
# Start mock server
npm run mock

# Or use the script directly
node scripts/start-mock-server.js start --daemon --port=3000
```

Set `base_url` to `http://localhost:3000` to use the mock server.

### Test Scripts

All requests include comprehensive test scripts that validate:
- Response structure and format
- Content quality and relevance
- Error handling and edge cases
- Performance metrics
- Safety ratings

## Automation

### GitHub Actions

The workspace includes automated maintenance via GitHub Actions:

- **Weekly Updates**: Checks for new models and API changes
- **Security Scanning**: Validates for secrets and vulnerabilities
- **Performance Monitoring**: Benchmarks response times
- **Documentation**: Auto-generates updated docs

### Manual Triggers

```bash
# Check for API updates
node scripts/check-api-updates.js

# Update workspace
node scripts/update-workspace.js

# Validate all collections
node scripts/validate-collections.js
```

## Documentation

### Quick Links
- [Getting Started Guide](docs/getting-started.md) - Setup and basic usage
- [Advanced Usage](docs/advanced-usage.md) - Power user features
- [API Reference](docs/api-reference.md) - Complete parameter reference

### Examples

#### Basic Text Generation
```json
{
  "contents": [
    {
      "parts": [{"text": "Explain quantum computing"}]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
```

#### Image Analysis
```json
{
  "contents": [
    {
      "parts": [
        {"text": "What's in this image?"},
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "base64_image_data"
          }
        }
      ]
    }
  ]
}
```

#### Chat Conversation
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Hello, I need help with Python"}]
    },
    {
      "role": "model",
      "parts": [{"text": "I'd be happy to help! What would you like to know?"}]
    },
    {
      "role": "user",
      "parts": [{"text": "How do I read a CSV file?"}]
    }
  ]
}
```

## Development

### Prerequisites
- Node.js 18+
- Postman desktop app
- Google AI Studio API key

### Setup for Development
1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Start mock server: `npm run mock`
5. Import collections into Postman
6. Start testing and developing!

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Code Style
- Use 2 spaces for indentation
- Follow existing patterns in collections
- Include comprehensive test scripts
- Document new features

## Security

### API Key Management
- Never commit API keys to the repository
- Use environment variables for sensitive data
- Rotate keys regularly
- Use separate keys for development and production

### Content Safety
- All requests include safety settings
- Configurable safety thresholds
- Content filtering validation
- Monitoring for sensitive content

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

### Getting Help
- Check the [documentation](docs/)
- Review [issues](../../issues) for common problems
- Join the [Postman Community](https://community.postman.com/)
- Visit [Google AI documentation](https://ai.google.dev/docs)

### Reporting Issues
1. Check existing issues first
2. Provide clear reproduction steps
3. Include environment details
4. Share relevant collection exports (remove API keys!)

## Acknowledgments

- Google AI team for the Gemini API
- Postman team for the excellent platform
- Open source community for inspiration
- Contributors and testers

## Project Status

- **Core Collections**: Complete
- **Documentation**: Complete
- **Testing Suite**: Complete
- **Mock Server**: Complete
- **CI/CD**: Complete
- **Ongoing**: API updates and maintenance

---

**Ready to explore the power of Gemini AI?** Start with the [Getting Started Guide](docs/getting-started.md) and join thousands of developers building the future with AI!

---

*This workspace is not officially affiliated with Google or Postman. It's a GCOS project to help developers work with Gemini APIs more effectively.*