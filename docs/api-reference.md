# Gemini API Reference

Complete reference documentation for the Gemini API endpoints, parameters, and configuration options.

---

## Base Configuration

### Endpoints

**Base URL:** `https://generativelanguage.googleapis.com`

| Endpoint | Description |
|----------|-------------|
| `/v1beta/models` | List available models |
| `/v1beta/models/{model}:generateContent` | Generate content (synchronous) |
| `/v1beta/models/{model}:streamGenerateContent` | Generate content (streaming) |

### Authentication

Include your API key as a query parameter in all requests:

```
?key=YOUR_API_KEY
```

---

## Available Models

| Model | Context Window | Max Output | Optimal Use Case |
|-------|----------------|------------|------------------|
| `gemini-1.5-pro` | 1M tokens | 8K tokens | Complex reasoning, code generation, multimodal tasks |
| `gemini-1.5-flash` | 1M tokens | 8K tokens | Fast responses, simple tasks, high throughput |

---

## Request Structure

### Basic Request

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 2048
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

### Content Types

**Text Content**
```json
{
  "parts": [
    {
      "text": "Your text prompt"
    }
  ]
}
```

**Image Content (Base64)**
```json
{
  "parts": [
    {
      "text": "Describe this image"
    },
    {
      "inline_data": {
        "mime_type": "image/jpeg",
        "data": "base64_encoded_image_data"
      }
    }
  ]
}
```

**Image Content (File URI)**
```json
{
  "parts": [
    {
      "file_data": {
        "mime_type": "image/jpeg",
        "file_uri": "gs://your-bucket/image.jpg"
      }
    }
  ]
}
```

---

## Generation Configuration

### Parameters

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `temperature` | float | 0.0 - 2.0 | 1.0 | Controls response randomness |
| `topK` | integer | 1 - 40 | 40 | Limits token selection to top K candidates |
| `topP` | float | 0.0 - 1.0 | 0.95 | Nucleus sampling threshold |
| `maxOutputTokens` | integer | 1 - 8192 | 2048 | Maximum response length |
| `candidateCount` | integer | 1 - 8 | 1 | Number of response variations |
| `stopSequences` | array | - | [] | Sequences that halt generation |

### Temperature Guidelines

| Range | Behavior | Recommended For |
|-------|----------|-----------------|
| 0.0 - 0.3 | Deterministic, focused | Technical documentation, code, factual content |
| 0.4 - 0.7 | Balanced | General Q&A, explanations, tutorials |
| 0.8 - 1.2 | Creative | Content writing, brainstorming, storytelling |
| 1.3 - 2.0 | Highly creative | Experimental outputs, artistic generation |

---

## System Instructions

Define the model's behavior and persona at the system level:

```json
{
  "system_instruction": {
    "parts": [
      {
        "text": "You are a helpful assistant specialized in software development. Provide code examples and follow best practices for security and performance."
      }
    ]
  }
}
```

**Best Practices:**
- Be specific about the role and expertise
- Define output format expectations
- Include any constraints or limitations
- Tailor instructions to your specific use case

---

## Safety Settings

### Categories

| Category | Description |
|----------|-------------|
| `HARM_CATEGORY_HARASSMENT` | Harassment and bullying content |
| `HARM_CATEGORY_HATE_SPEECH` | Hate speech and discrimination |
| `HARM_CATEGORY_SEXUALLY_EXPLICIT` | Sexually explicit content |
| `HARM_CATEGORY_DANGEROUS_CONTENT` | Content promoting dangerous activities |

### Thresholds

| Threshold | Blocking Behavior |
|-----------|-------------------|
| `BLOCK_NONE` | No content filtering |
| `BLOCK_ONLY_HIGH` | Block high-probability harmful content |
| `BLOCK_MEDIUM_AND_ABOVE` | Block medium and high-probability content |
| `BLOCK_LOW_AND_ABOVE` | Block low, medium, and high-probability content |

**Example Configuration:**
```json
{
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

---

## Function Calling

Enable the model to call external functions and APIs:

```json
{
  "tools": [
    {
      "function_declarations": [
        {
          "name": "get_current_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "City and state, e.g., San Francisco, CA"
              },
              "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"]
              }
            },
            "required": ["location"]
          }
        }
      ]
    }
  ]
}
```

### Function Call Response

When the model invokes a function:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "functionCall": {
              "name": "get_current_weather",
              "args": {
                "location": "San Francisco, CA",
                "unit": "fahrenheit"
              }
            }
          }
        ]
      }
    }
  ]
}
```

---

## Response Format

### Success Response

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Generated response text"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": [
        {
          "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          "probability": "NEGLIGIBLE"
        }
      ]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 25,
    "totalTokenCount": 35
  }
}
```

### Finish Reasons

| Reason | Description |
|--------|-------------|
| `STOP` | Natural completion point reached |
| `MAX_TOKENS` | Maximum token limit reached |
| `SAFETY` | Content blocked by safety filters |
| `RECITATION` | Content blocked due to recitation detection |
| `OTHER` | Other termination reason |

### Safety Rating Probabilities

| Level | Description |
|-------|-------------|
| `NEGLIGIBLE` | Minimal or no risk |
| `LOW` | Low risk detected |
| `MEDIUM` | Moderate risk detected |
| `HIGH` | High risk detected |

---

## Streaming Responses

### Endpoint

```
POST /v1beta/models/gemini-1.5-pro:streamGenerateContent
```

### Response Format

Streaming responses are delivered as newline-delimited JSON chunks:

```
{"candidates":[{"content":{"parts":[{"text":"The"}]}}]}
{"candidates":[{"content":{"parts":[{"text":" weather"}]}}]}
{"candidates":[{"content":{"parts":[{"text":" is sunny"}]}}]}
```

**Implementation Notes:**
- Parse each line as a separate JSON object
- Accumulate text from each chunk
- Monitor for `finishReason` in the final chunk
- Handle potential error objects in the stream

---

## Error Handling

### HTTP Status Codes

| Code | Status | Description | Resolution |
|------|--------|-------------|------------|
| 400 | `INVALID_ARGUMENT` | Malformed request | Validate request structure and parameters |
| 401 | `UNAUTHENTICATED` | Missing or invalid API key | Verify API key is correct and active |
| 403 | `PERMISSION_DENIED` | Insufficient permissions | Check API key permissions and quotas |
| 404 | `NOT_FOUND` | Invalid endpoint or model | Verify endpoint URL and model name |
| 429 | `RESOURCE_EXHAUSTED` | Rate limit exceeded | Implement exponential backoff |
| 500 | `INTERNAL` | Server error | Retry with exponential backoff |

### Error Response Structure

```json
{
  "error": {
    "code": 400,
    "message": "Invalid request format",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "INVALID_CONTENT",
        "domain": "generativelanguage.googleapis.com"
      }
    ]
  }
}
```

---

## Rate Limits

### Default Quotas

| Model | Requests/Minute | Tokens/Minute |
|-------|-----------------|---------------|
| Gemini 1.5 Pro | 60 | 1,000,000 |
| Gemini 1.5 Flash | 1,000 | 4,000,000 |

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### Best Practices

1. **Exponential Backoff:** Implement retry logic with increasing delays
2. **Request Batching:** Combine multiple prompts when possible
3. **Usage Monitoring:** Track token consumption and request counts
4. **Response Caching:** Store and reuse responses for identical queries
5. **Load Distribution:** Distribute requests across time to avoid spikes

---

## Token Estimation

### Approximation Guidelines

| Content Type | Characters per Token |
|--------------|---------------------|
| English text | ~4 characters |
| Code | ~3-4 characters |
| Other languages | 2-6 characters (varies) |

### Optimization Strategies

- Remove unnecessary verbosity from prompts
- Use concise system instructions
- Limit conversation history to relevant context
- Test different prompt formulations for efficiency
- Monitor `usageMetadata` in responses

---

## Additional Resources

- **Official Documentation:** [ai.google.dev/docs](https://ai.google.dev/docs)
- **API Updates:** Check for the latest features and model releases
- **Community:** Google AI Developer Community for support and examples

---

**Version:** v1beta  
**Last Updated:** October 2025