# Quick Setup Guide for Gemini API Postman Workspace

## **Status: Ready to Use!**

Your comprehensive Gemini API Postman workspace is fully configured and ready to use. Your API key has been tested and is working correctly.

## **Quick Start (5 minutes)**

### 1. Import to Postman
1. Open Postman desktop application
2. Click **Import**
3. Select **Folder** and choose the entire `postman-gemini-workspace` directory
4. Postman will automatically import all collections and environments

### 2. Select Environment
1. In Postman, click the environment dropdown (top right)
2. Select **"Gemini API - Development"**
3. Your API key is already configured: `AIzaSyCrgFvspruL5bP48JXJVO0Zz1ILO_ZXr5c`

### 3. Test Connection
1. Go to **Collections** → **Text Generation**
2. Run **"Basic Text Generation"** request
3. You should get a creative AI-generated response

## **What's Included**

### Collections Ready to Use:
- **Text Generation** (6 requests) - Creative writing, explanations, Q&A
- **Chat & Conversation** (5 requests) - Multi-turn conversations
- **Vision & Image Analysis** (2 requests) - Image understanding
- **Code Generation** (7 requests) - Programming assistance

### Key Features:
- **Latest Models**: Updated to use Gemini 2.0 Flash and 2.5 Flash
- **Comprehensive Testing**: Built-in validation scripts
- **Error Handling**: Robust error checking and logging
- **Documentation**: Complete guides and examples
- **Mock Server**: Local development server included

## **Test Different Capabilities**

### Text Generation
```bash
# Test creative writing
POST: Text Generation → Basic Text Generation
```

### Chat Conversation
```bash
# Test multi-turn chat
POST: Chat & Conversation → Start New Conversation
```

### Code Generation
```bash
# Test programming assistance
POST: Code Generation → Generate Code from Description
```

### Vision Analysis
```bash
# Test image understanding (requires base64 image)
POST: Vision & Image Analysis → Basic Image Analysis
```

## Environment Variables Configured

| Variable | Value | Purpose |
|----------|-------|---------|
| `GEMINI_API_KEY` | `AIzaSyCrgFvspruL5bP48JXJVO0Zz1ILO_ZXr5c` | Your API key |
| `base_url` | `https://generativelanguage.googleapis.com` | API endpoint |
| `model_name` | `gemini-2.0-flash` | Default text model |
| `chat_model_name` | `gemini-2.0-flash` | Chat model |
| `code_model_name` | `gemini-2.5-flash` | Code generation model |

## Optional: Mock Server for Local Testing

To save API costs during development:

```bash
# Install dependencies
npm install

# Start mock server
npm run mock

# In Postman, change base_url to: http://localhost:3000
```

## **Documentation**

- **`docs/getting-started.md`** - Complete setup guide
- **`docs/advanced-usage.md`** - Power user features
- **`docs/api-reference.md`** - Full API documentation

## **Success Indicators**

If everything is working correctly, you should see:
- Status 200 responses
- Generated text in response body
- Token usage information
- Test scripts passing (green checkmarks)

## **Troubleshooting**

### Common Issues:
- **401 Unauthorized**: API key issue (check environment variables)
- **429 Rate Limited**: Too many requests (wait a minute)
- **400 Bad Request**: Check request format

### Need Help?
- Check the `docs/` folder for detailed guides
- Review request examples in collections
- Verify environment variables are set correctly

---

** Ready to explore the power of Gemini AI!** Start with basic text generation and work your way up to advanced multi-modal interactions.

**Note**: This workspace includes the latest Gemini 2.0 and 2.5 models with enhanced capabilities. Your API key has been tested and verified working.