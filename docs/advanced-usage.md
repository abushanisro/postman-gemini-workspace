# Advanced Usage Guide

This guide covers advanced features and techniques for maximizing the potential of the Gemini API Postman workspace.

## Workflow Automation

### Chaining Requests

Use Postman workflow features to create sophisticated request chains:

```javascript
// In test script - conditionally run next request
if (pm.response.code === 200) {
    postman.setNextRequest("Generate Code");
} else {
    postman.setNextRequest("Error Handler");
}
```

### Dynamic Variables

Store and reuse response data across requests:

```javascript
// Store generated content
const response = pm.response.json();
const generatedText = response.candidates[0].content.parts[0].text;
pm.globals.set("previous_response", generatedText);

// Use in subsequent request
{
  "contents": [
    {
      "parts": [
        {
          "text": "Please improve this code: {{previous_response}}"
        }
      ]
    }
  ]
}
```

## 🎛️ Advanced Configuration

### Custom Generation Configs

```json
{
  "generationConfig": {
    "temperature": 0.9,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 2048,
    "stopSequences": ["END", "STOP"],
    "candidateCount": 1
  }
}
```

### System Instructions

Define AI behavior with system instructions:

```json
{
  "system_instruction": {
    "parts": [
      {
        "text": "You are a senior software architect. Always consider scalability, maintainability, and security. Provide detailed explanations and code examples."
      }
    ]
  },
  "contents": [...]
}
```

### Function Calling

Enable AI to call predefined functions:

```json
{
  "tools": [
    {
      "function_declarations": [
        {
          "name": "get_weather",
          "description": "Get current weather for a location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "City and country"
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

## Performance Optimization

### Request Batching

Process multiple inputs efficiently:

```javascript
// Pre-request script
const inputs = [
    "Explain quantum computing",
    "Describe machine learning",
    "What is blockchain?"
];

pm.globals.set("current_input", inputs[0]);
pm.globals.set("remaining_inputs", JSON.stringify(inputs.slice(1)));
```

### Caching Strategies

Implement response caching to reduce API calls:

```javascript
// Check cache before making request
const cacheKey = CryptoJS.MD5(pm.request.body.raw).toString();
const cached = pm.globals.get(`cache_${cacheKey}`);

if (cached) {
    console.log("Using cached response");
    // Skip request or use cached data
}

// Store response in cache
const response = pm.response.json();
pm.globals.set(`cache_${cacheKey}`, JSON.stringify(response));
```

### Rate Limiting

Implement intelligent rate limiting:

```javascript
// Rate limiting with exponential backoff
const lastRequestTime = pm.globals.get("last_request_time") || 0;
const currentTime = Date.now();
const timeSinceLastRequest = currentTime - lastRequestTime;

if (timeSinceLastRequest < 1000) { // 1 second minimum
    const delay = 1000 - timeSinceLastRequest;
    setTimeout(() => {
        // Make request
    }, delay);
}

pm.globals.set("last_request_time", currentTime);
```

## Advanced Testing

### Custom Test Suites

Create comprehensive test validation:

```javascript
// Advanced response validation
pm.test("Content Quality Assessment", function () {
    const response = pm.response.json();
    const text = response.candidates[0].content.parts[0].text;

    // Length validation
    pm.expect(text.length).to.be.above(50);

    // Content relevance (keyword matching)
    const prompt = JSON.parse(pm.request.body.raw).contents[0].parts[0].text;
    const promptKeywords = prompt.toLowerCase().match(/\b\w+\b/g);
    const responseKeywords = text.toLowerCase().match(/\b\w+\b/g);

    const overlap = promptKeywords.filter(word =>
        responseKeywords.includes(word)
    ).length;

    pm.expect(overlap).to.be.above(0);
});

// Token efficiency testing
pm.test("Token Efficiency", function () {
    const usage = pm.response.json().usageMetadata;
    const ratio = usage.candidatesTokenCount / usage.promptTokenCount;

    // Expect reasonable output-to-input ratio
    pm.expect(ratio).to.be.above(0.1).and.below(10);
});
```

### Performance Benchmarking

Track and analyze performance metrics:

```javascript
// Performance tracking
const startTime = pm.globals.get("request_start_time");
const endTime = Date.now();
const totalTime = endTime - startTime;

const metrics = {
    responseTime: pm.response.responseTime,
    totalTime: totalTime,
    tokenCount: pm.response.json().usageMetadata.totalTokenCount,
    timestamp: new Date().toISOString()
};

// Store metrics for analysis
const allMetrics = JSON.parse(pm.globals.get("performance_metrics") || "[]");
allMetrics.push(metrics);
pm.globals.set("performance_metrics", JSON.stringify(allMetrics));

// Calculate averages
const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.responseTime, 0) / allMetrics.length;
console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
```

## Multi-Modal Workflows

### Image Analysis Pipeline

Process images through multiple analysis stages:

```javascript
// Stage 1: Basic description
{
  "contents": [
    {
      "parts": [
        {"text": "Describe this image briefly"},
        {"inline_data": {"mime_type": "image/jpeg", "data": "{{image_data}}"}}
      ]
    }
  ]
}

// Stage 2: Detailed analysis (uses previous description)
{
  "contents": [
    {
      "parts": [
        {"text": "Based on this description: '{{basic_description}}', provide detailed technical analysis of the image including composition, lighting, and technical quality."},
        {"inline_data": {"mime_type": "image/jpeg", "data": "{{image_data}}"}}
      ]
    }
  ]
}
```

### Code Review Workflow

Automated code review process:

```javascript
// 1. Initial code analysis
{
  "system_instruction": {
    "parts": [{"text": "You are a senior code reviewer. Focus on finding bugs and security issues."}]
  },
  "contents": [
    {"parts": [{"text": "Review this code for bugs:\n\n```\n{{code_to_review}}\n```"}]}
  ]
}

// 2. Performance optimization suggestions
{
  "system_instruction": {
    "parts": [{"text": "You are a performance optimization expert."}]
  },
  "contents": [
    {"parts": [{"text": "Suggest performance improvements for:\n\n```\n{{code_to_review}}\n```"}]}
  ]
}

// 3. Generate unit tests
{
  "system_instruction": {
    "parts": [{"text": "You are a test automation expert."}]
  },
  "contents": [
    {"parts": [{"text": "Generate comprehensive unit tests for:\n\n```\n{{code_to_review}}\n```"}]}
  ]
}
```

## Security Best Practices

### API Key Management

```javascript
// Secure API key validation
pm.test("API Key Security", function () {
    const apiKey = pm.environment.get("GEMINI_API_KEY");

    // Ensure API key is not hardcoded
    pm.expect(apiKey).to.not.be.undefined;
    pm.expect(apiKey).to.not.equal("your_api_key_here");

    // Check key format
    pm.expect(apiKey).to.match(/^AIza[A-Za-z0-9_-]{35}$/);
});
```

### Content Filtering

Implement content safety checks:

```javascript
// Pre-request content validation
const requestBody = JSON.parse(pm.request.body.raw);
const userContent = requestBody.contents[0].parts[0].text;

// Basic content filtering
const sensitivePatterns = [
    /password/i,
    /api[_\s]?key/i,
    /secret/i,
    /token/i
];

const hasSensitiveContent = sensitivePatterns.some(pattern =>
    pattern.test(userContent)
);

if (hasSensitiveContent) {
    console.warn("Potential sensitive content detected");
}
```

## Analytics and Monitoring

### Usage Tracking

Monitor API usage patterns:

```javascript
// Track usage statistics
const usage = pm.response.json().usageMetadata;
const stats = JSON.parse(pm.globals.get("usage_stats") || "{}");

stats.totalRequests = (stats.totalRequests || 0) + 1;
stats.totalTokens = (stats.totalTokens || 0) + usage.totalTokenCount;
stats.lastRequest = new Date().toISOString();

// Calculate costs (example rates)
const costPerToken = 0.00001; // Example rate
stats.estimatedCost = (stats.estimatedCost || 0) + (usage.totalTokenCount * costPerToken);

pm.globals.set("usage_stats", JSON.stringify(stats));

// Log periodic summaries
if (stats.totalRequests % 10 === 0) {
    console.log(`Usage Summary: ${stats.totalRequests} requests, ${stats.totalTokens} tokens, $${stats.estimatedCost.toFixed(4)} estimated cost`);
}
```

### Error Tracking

Comprehensive error monitoring:

```javascript
// Error categorization and tracking
if (pm.response.code >= 400) {
    const errorData = {
        code: pm.response.code,
        message: pm.response.json().error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
        endpoint: pm.request.url.toString(),
        requestBody: pm.request.body.raw
    };

    const errors = JSON.parse(pm.globals.get("error_log") || "[]");
    errors.push(errorData);

    // Keep only last 100 errors
    if (errors.length > 100) {
        errors.splice(0, errors.length - 100);
    }

    pm.globals.set("error_log", JSON.stringify(errors));

    // Alert on repeated errors
    const recentErrors = errors.filter(e =>
        Date.now() - new Date(e.timestamp).getTime() < 300000 // Last 5 minutes
    );

    if (recentErrors.length > 5) {
        console.error("High error rate detected!");
    }
}
```

## Production Deployment

### Environment Management

Switch between environments seamlessly:

```javascript
// Dynamic environment switching
const environment = pm.environment.get("environment_type");

if (environment === "production") {
    // Production-specific configurations
    pm.globals.set("debug_mode", "false");
    pm.globals.set("log_level", "error");
} else {
    // Development configurations
    pm.globals.set("debug_mode", "true");
    pm.globals.set("log_level", "debug");
}
```

### Health Checks

Automated health monitoring:

```javascript
// Comprehensive health check
pm.test("System Health", function () {
    const response = pm.response.json();

    // Response time check
    pm.expect(pm.response.responseTime).to.be.below(5000);

    // Model availability
    pm.expect(response.models).to.be.an('array');
    pm.expect(response.models.length).to.be.above(0);

    // Service status
    const geminiModels = response.models.filter(m =>
        m.name.includes('gemini')
    );
    pm.expect(geminiModels.length).to.be.above(0);
});
```

## Integration Examples

### CI/CD Integration

Use Newman for automated testing:

```bash
# Run tests in CI/CD pipeline
newman run \
  --collection gemini-api-collection.json \
  --environment production.json \
  --reporters junit,cli \
  --reporter-junit-export results.xml
```

### Custom Reporting

Generate detailed test reports:

```javascript
// Custom test reporting
pm.test("Generate Test Report", function () {
    const report = {
        testSuite: "Gemini API Tests",
        timestamp: new Date().toISOString(),
        environment: pm.environment.name,
        results: {
            passed: pm.test.results.length - pm.test.results.filter(r => r.error).length,
            failed: pm.test.results.filter(r => r.error).length,
            total: pm.test.results.length
        },
        performance: {
            averageResponseTime: pm.response.responseTime,
            totalTokensUsed: pm.response.json().usageMetadata?.totalTokenCount
        }
    };

    pm.globals.set("test_report", JSON.stringify(report, null, 2));
});
```

---

This advanced guide provides the foundation for building sophisticated AI-powered workflows with the Gemini API. Experiment with these patterns and adapt them to your specific use cases!