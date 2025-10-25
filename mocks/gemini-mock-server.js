#!/usr/bin/env node

/**
 * Gemini API Mock Server
 * Provides realistic mock responses for local development and testing
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

class GeminiMockServer {
    constructor(port = 3000) {
        this.app = express();
        this.port = port;
        this.requestCount = 0;

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // CORS
        this.app.use(cors());

        // JSON parsing
        this.app.use(express.json({ limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            this.requestCount++;
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request #${this.requestCount}`);
            next();
        });

        // Rate limiting (simulate API limits)
        const limiter = rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 60, // 60 requests per minute
            message: {
                error: {
                    code: 429,
                    message: 'Rate limit exceeded. Please try again later.',
                    status: 'RESOURCE_EXHAUSTED'
                }
            }
        });
        this.app.use('/v1beta', limiter);

        // API key validation
        this.app.use('/v1beta', (req, res, next) => {
            const apiKey = req.query.key || req.headers['x-api-key'];

            if (!apiKey) {
                return res.status(401).json({
                    error: {
                        code: 401,
                        message: 'API key is required',
                        status: 'UNAUTHENTICATED'
                    }
                });
            }

            if (apiKey === 'invalid_key_12345') {
                return res.status(401).json({
                    error: {
                        code: 401,
                        message: 'Invalid API key provided',
                        status: 'UNAUTHENTICATED'
                    }
                });
            }

            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                server: 'Gemini Mock Server',
                timestamp: new Date().toISOString(),
                requests_served: this.requestCount
            });
        });

        // List models
        this.app.get('/v1beta/models', (req, res) => {
            res.json({
                models: [
                    {
                        name: 'models/gemini-1.5-pro',
                        version: '001',
                        displayName: 'Gemini 1.5 Pro',
                        description: 'Mid-size multimodal model',
                        inputTokenLimit: 1048576,
                        outputTokenLimit: 8192,
                        supportedGenerationMethods: ['generateContent', 'streamGenerateContent']
                    },
                    {
                        name: 'models/gemini-1.5-flash',
                        version: '001',
                        displayName: 'Gemini 1.5 Flash',
                        description: 'Fast and versatile multimodal model',
                        inputTokenLimit: 1048576,
                        outputTokenLimit: 8192,
                        supportedGenerationMethods: ['generateContent', 'streamGenerateContent']
                    }
                ]
            });
        });

        // Generate content
        this.app.post('/v1beta/models/:model/generateContent', (req, res) => {
            this.handleGenerateContent(req, res, false);
        });

        // Stream generate content
        this.app.post('/v1beta/models/:model/streamGenerateContent', (req, res) => {
            this.handleGenerateContent(req, res, true);
        });

        // Default route
        this.app.all('*', (req, res) => {
            res.status(404).json({
                error: {
                    code: 404,
                    message: `Endpoint not found: ${req.method} ${req.path}`,
                    status: 'NOT_FOUND'
                }
            });
        });
    }

    handleGenerateContent(req, res, isStreaming = false) {
        try {
            const { contents, generationConfig, safetySettings } = req.body;

            // Validate request
            if (!contents || !Array.isArray(contents)) {
                return res.status(400).json({
                    error: {
                        code: 400,
                        message: 'contents field is required and must be an array',
                        status: 'INVALID_ARGUMENT'
                    }
                });
            }

            // Simulate processing delay
            const delay = Math.random() * 1000 + 500; // 500-1500ms

            setTimeout(() => {
                const response = this.generateMockResponse(req.body, req.params.model);

                if (isStreaming) {
                    this.sendStreamingResponse(res, response);
                } else {
                    res.json(response);
                }
            }, delay);

        } catch (error) {
            res.status(500).json({
                error: {
                    code: 500,
                    message: 'Internal server error',
                    status: 'INTERNAL'
                }
            });
        }
    }

    generateMockResponse(requestBody, model) {
        const { contents, generationConfig = {} } = requestBody;
        const lastContent = contents[contents.length - 1];
        const userText = lastContent.parts?.[0]?.text || '';

        // Generate appropriate mock response based on content
        let responseText = this.generateContextualResponse(userText, contents);

        // Apply generation config
        if (generationConfig.maxOutputTokens) {
            const maxWords = Math.floor(generationConfig.maxOutputTokens / 1.3); // Rough token to word ratio
            const words = responseText.split(' ');
            if (words.length > maxWords) {
                responseText = words.slice(0, maxWords).join(' ') + '...';
            }
        }

        // Calculate token usage
        const promptTokens = this.estimateTokens(JSON.stringify(contents));
        const responseTokens = this.estimateTokens(responseText);

        return {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: responseText
                            }
                        ],
                        role: 'model'
                    },
                    finishReason: 'STOP',
                    index: 0,
                    safetyRatings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            probability: 'NEGLIGIBLE'
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            probability: 'NEGLIGIBLE'
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            probability: 'NEGLIGIBLE'
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            probability: 'NEGLIGIBLE'
                        }
                    ]
                }
            ],
            usageMetadata: {
                promptTokenCount: promptTokens,
                candidatesTokenCount: responseTokens,
                totalTokenCount: promptTokens + responseTokens
            },
            modelVersion: model || 'gemini-1.5-pro-001'
        };
    }

    generateContextualResponse(userText, contents) {
        const text = userText.toLowerCase();

        // Check for image content
        const hasImage = contents.some(content =>
            content.parts?.some(part => part.inline_data || part.file_data)
        );

        if (hasImage) {
            return this.generateImageResponse(userText);
        }

        // Context-aware responses
        if (text.includes('haiku')) {
            return 'APIs tested well,\\nResponses flow like data streams,\\nCode in harmony.';
        }

        if (text.includes('code') || text.includes('function') || text.includes('python') || text.includes('javascript')) {
            return this.generateCodeResponse(userText);
        }

        if (text.includes('error') || text.includes('debug') || text.includes('fix')) {
            return this.generateDebugResponse(userText);
        }

        if (text.includes('explain') || text.includes('what is') || text.includes('how to')) {
            return this.generateExplanationResponse(userText);
        }

        if (text.includes('test') || text.includes('testing')) {
            return 'Testing is crucial for reliable software. I recommend implementing unit tests, integration tests, and end-to-end tests. Mock servers like this one help simulate external dependencies during development.';
        }

        // Default creative response
        return this.generateDefaultResponse(userText);
    }

    generateImageResponse(userText) {
        const responses = [
            'I can see this is an image. Based on the visual content, I notice various elements including colors, shapes, and objects. The composition appears to be well-balanced with good contrast.',
            'This image contains multiple visual elements. I can identify different colors and textures throughout the composition. The lighting and perspective create an interesting visual narrative.',
            'Looking at this image, I observe several key features including the main subject matter, background elements, and overall visual style. The image quality appears clear and well-composed.'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateCodeResponse(userText) {
        if (userText.includes('python')) {
            return `def example_function(data):\n    \"\"\"\n    Example Python function based on your request.\n    \"\"\"\n    try:\n        result = process_data(data)\n        return result\n    except Exception as e:\n        logging.error(f\"Error processing data: {e}\")\n        return None\n\n# Usage example\nresult = example_function(your_data)`;
        }

        if (userText.includes('javascript')) {
            return `function exampleFunction(data) {\n  /**\n   * Example JavaScript function based on your request.\n   */\n  try {\n    const result = processData(data);\n    return result;\n  } catch (error) {\n    console.error('Error processing data:', error);\n    return null;\n  }\n}\n\n// Usage example\nconst result = exampleFunction(yourData);`;
        }

        return 'Here\'s a code solution based on your request. The implementation follows best practices including error handling, proper documentation, and clean structure. Would you like me to explain any specific part?';
    }

    generateDebugResponse(userText) {
        return 'Based on the error you\'re experiencing, here are the most likely causes:\\n\\n1. **Null/undefined values**: Check if variables are properly initialized\\n2. **Type mismatches**: Verify data types match expected values\\n3. **Scope issues**: Ensure variables are accessible where needed\\n4. **Async/await problems**: Check if promises are properly handled\\n\\nI recommend adding console.log statements or using a debugger to trace the execution flow.';
    }

    generateExplanationResponse(userText) {
        return 'Let me explain this concept clearly:\\n\\nThe topic you\'re asking about involves several key components that work together. Each part has a specific role and understanding their interactions is crucial for practical implementation.\\n\\nWould you like me to dive deeper into any particular aspect?';
    }

    generateDefaultResponse(userText) {
        const responses = [
            'That\'s an interesting question! Let me provide you with a comprehensive response that addresses your specific needs and context.',
            'I understand what you\'re looking for. Based on your request, I can offer several insights and practical suggestions.',
            'Thank you for your question. I\'ll break this down into clear, actionable information that you can use immediately.',
            'This is a great topic to explore. Let me share some detailed information and best practices that will be helpful.',
        ];
        return responses[Math.floor(Math.random() * responses.length)] + ` Your query about "${userText.substring(0, 50)}${userText.length > 50 ? '...' : ''}" requires a thoughtful approach. I recommend considering multiple perspectives and gathering additional context as needed.`;
    }

    sendStreamingResponse(res, fullResponse) {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked'
        });

        const text = fullResponse.candidates[0].content.parts[0].text;
        const words = text.split(' ');
        let currentText = '';

        // Simulate streaming by sending words progressively
        words.forEach((word, index) => {
            setTimeout(() => {
                currentText += word + ' ';

                const streamChunk = {
                    ...fullResponse,
                    candidates: [{
                        ...fullResponse.candidates[0],
                        content: {
                            ...fullResponse.candidates[0].content,
                            parts: [{ text: currentText.trim() }]
                        }
                    }]
                };

                res.write(JSON.stringify(streamChunk) + '\\n');

                if (index === words.length - 1) {
                    res.end();
                }
            }, index * 100); // 100ms delay between words
        });
    }

    estimateTokens(text) {
        // Rough estimation: ~1.3 characters per token
        return Math.ceil(text.length / 1.3);
    }

    setupErrorHandling() {
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            res.status(500).json({
                error: {
                    code: 500,
                    message: 'Internal server error',
                    status: 'INTERNAL'
                }
            });
        });
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Gemini Mock Server running on port ${this.port}`);
            console.log(`Health check: http://localhost:${this.port}/health`);
            console.log(`API base URL: http://localhost:${this.port}/v1beta`);
            console.log(`\\nUsage in Postman:`);
            console.log(`   Set base_url environment variable to: http://localhost:${this.port}`);
            console.log(`   Use any API key except 'invalid_key_12345'`);
        });
    }
}

// Start server if run directly
if (require.main === module) {
    const port = process.env.MOCK_SERVER_PORT || 3000;
    const server = new GeminiMockServer(port);
    server.start();
}

module.exports = GeminiMockServer;