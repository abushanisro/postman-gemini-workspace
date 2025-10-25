/**
 * COMPLETE POSTMAN TEST SCRIPTS FOR GEMINI API COLLECTIONS

 */

// ============================================================================
// 1. TEXT GENERATION COLLECTION - Complete Test Script
// ============================================================================

// Status and format validation
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response is JSON', function () {
    pm.response.to.be.json;
});

// Safe response parsing with error handling
var textGenResponse;
try {
    textGenResponse = pm.response.json();
} catch (e) {
    console.error('Failed to parse JSON response:', e);
    pm.test('Response parsing failed', function() {
        pm.expect.fail('Invalid JSON response');
    });
}

if (textGenResponse) {
    // Validate basic Gemini API structure
    pm.test('Valid Gemini API Response Structure', function () {
        pm.expect(textGenResponse).to.have.property('candidates');
        pm.expect(textGenResponse.candidates).to.be.an('array');
        pm.expect(textGenResponse.candidates.length).to.be.above(0);
        pm.expect(textGenResponse.candidates[0]).to.have.property('content');
        pm.expect(textGenResponse.candidates[0].content).to.have.property('parts');
        pm.expect(textGenResponse.candidates[0].content.parts).to.be.an('array');
        pm.expect(textGenResponse.candidates[0].content.parts.length).to.be.above(0);
    });

    // Validate text content quality
    pm.test('Text Content Validation', function () {
        var textContent = textGenResponse.candidates[0].content.parts[0].text;
        pm.expect(textContent).to.be.a('string');
        pm.expect(textContent.length).to.be.above(10);
        pm.expect(textContent.trim().length).to.be.above(0);
        pm.expect(textContent).to.not.equal('');
    });

    // Validate usage metadata
    pm.test('Usage Metadata Present', function () {
        pm.expect(textGenResponse).to.have.property('usageMetadata');
        pm.expect(textGenResponse.usageMetadata).to.have.property('promptTokenCount');
        pm.expect(textGenResponse.usageMetadata).to.have.property('candidatesTokenCount');
        pm.expect(textGenResponse.usageMetadata).to.have.property('totalTokenCount');
        pm.expect(textGenResponse.usageMetadata.totalTokenCount).to.be.above(0);
    });

    // Validate finish reason
    pm.test('Finish Reason Validation', function () {
        pm.expect(textGenResponse.candidates[0]).to.have.property('finishReason');
        var finishReason = textGenResponse.candidates[0].finishReason;
        pm.expect(finishReason).to.be.oneOf(['STOP', 'MAX_TOKENS', 'SAFETY', 'RECITATION', 'OTHER']);
    });

    // Safety ratings check
    pm.test('Safety Ratings Available', function () {
        if (textGenResponse.candidates[0].safetyRatings) {
            pm.expect(textGenResponse.candidates[0].safetyRatings).to.be.an('array');
            textGenResponse.candidates[0].safetyRatings.forEach(function(rating) {
                pm.expect(rating).to.have.property('category');
                pm.expect(rating).to.have.property('probability');
            });
        }
    });

    // Performance check
    pm.test('API Response Time Acceptable', function () {
        var timeout = parseInt(pm.environment.get('request_timeout')) || 30000;
        pm.expect(pm.response.responseTime).to.be.below(timeout);
    });

    // Debug logging
    if (pm.environment.get('debug_mode') === 'true') {
        console.log('=== Text Generation Debug Info ===');
        console.log('Model Version:', textGenResponse.modelVersion || 'Not specified');
        console.log('Response Time:', pm.response.responseTime + 'ms');
        console.log('Token Usage:', JSON.stringify(textGenResponse.usageMetadata, null, 2));
        console.log('Finish Reason:', textGenResponse.candidates[0].finishReason);
        console.log('Text Length:', textGenResponse.candidates[0].content.parts[0].text.length);
        console.log('First 200 chars:', textGenResponse.candidates[0].content.parts[0].text.substring(0, 200));
    }
}

// Authentication validation
pm.test('API Key Authentication Success', function () {
    pm.expect(pm.response.code).to.not.equal(401);
    pm.expect(pm.response.code).to.not.equal(403);
});

// Error handling
if (pm.response.code >= 400) {
    pm.test('Error Response Format', function () {
        var errorResponse = pm.response.json();
        pm.expect(errorResponse).to.have.property('error');
        if (errorResponse.error) {
            console.error('=== API Error ===');
            console.error('Status:', pm.response.code);
            console.error('Message:', errorResponse.error.message || 'No message');
            console.error('Code:', errorResponse.error.code || 'No code');
            console.error('Status:', errorResponse.error.status || 'No status');
        }
    });
}

// Rate limit monitoring
var textGenRateLimitRemaining = pm.response.headers.get('X-RateLimit-Remaining');
var textGenRateLimitLimit = pm.response.headers.get('X-RateLimit-Limit');
if (textGenRateLimitRemaining) {
    console.log('Rate Limit Remaining:', textGenRateLimitRemaining + '/' + (textGenRateLimitLimit || 'unknown'));
    if (parseInt(textGenRateLimitRemaining) < 10) {
        console.warn('WARNING: Rate limit running low!');
    }
}


// ============================================================================
// 2. CODE GENERATION COLLECTION - Complete Test Script
// ============================================================================

pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response is JSON', function () {
    pm.response.to.be.json;
});

var codeGenResponse;
try {
    codeGenResponse = pm.response.json();
} catch (e) {
    console.error('Failed to parse JSON response:', e);
    pm.test('Response parsing failed', function() {
        pm.expect.fail('Invalid JSON response');
    });
}

if (codeGenResponse) {
    // Core structure validation
    pm.test('Valid Gemini API Response Structure', function () {
        pm.expect(codeGenResponse).to.have.property('candidates');
        pm.expect(codeGenResponse.candidates).to.be.an('array');
        pm.expect(codeGenResponse.candidates.length).to.be.above(0);
        pm.expect(codeGenResponse.candidates[0]).to.have.property('content');
        pm.expect(codeGenResponse.candidates[0].content).to.have.property('parts');
    });

    // Code-specific validation
    pm.test('Code Generation Quality Check', function () {
        var text = codeGenResponse.candidates[0].content.parts[0].text;
        pm.expect(text).to.be.a('string');
        pm.expect(text.length).to.be.above(20);

        // Check for code indicators (functions, classes, syntax)
        var codePatterns = [
            /```/,
            /function\s+\w+/,
            /class\s+\w+/,
            /def\s+\w+/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /public\s+\w+/,
            /private\s+\w+/,
            /import\s+.*from/,
            /export\s+(default|const|function|class)/,
            /=>|->|\{|\}|\(|\)|\[|\]/
        ];

        var hasCodeIndicators = codePatterns.some(function(pattern) {
            return pattern.test(text);
        });
        pm.expect(hasCodeIndicators, 'Response should contain code syntax').to.be.true;
    });

    // Code block detection
    pm.test('Code Blocks Present', function () {
        var text = codeGenResponse.candidates[0].content.parts[0].text;
        var codeBlockMatches = text.match(/```/g);
        
        if (codeBlockMatches) {
            console.log('Found', codeBlockMatches.length / 2, 'code block(s)');
            pm.expect(codeBlockMatches.length % 2).to.equal(0);
        }
    });

    pm.test('Text Content Not Empty', function () {
        var textContent = codeGenResponse.candidates[0].content.parts[0].text;
        pm.expect(textContent.trim().length).to.be.above(0);
    });

    pm.test('Usage Metadata Present', function () {
        pm.expect(codeGenResponse).to.have.property('usageMetadata');
        pm.expect(codeGenResponse.usageMetadata).to.have.property('totalTokenCount');
        pm.expect(codeGenResponse.usageMetadata.totalTokenCount).to.be.above(0);
    });

    pm.test('Finish Reason Valid', function () {
        var finishReason = codeGenResponse.candidates[0].finishReason;
        pm.expect(finishReason).to.be.oneOf(['STOP', 'MAX_TOKENS', 'SAFETY', 'OTHER']);
    });

    pm.test('API Response Performance', function () {
        pm.expect(pm.response.responseTime).to.be.below(30000);
    });

    // Extract and log code snippets
    if (pm.environment.get('debug_mode') === 'true') {
        var text = codeGenResponse.candidates[0].content.parts[0].text;
        var codeBlocks = text.match(/```[\s\S]*?```/g);
        
        console.log('=== Code Generation Debug Info ===');
        console.log('Total Response Length:', text.length);
        console.log('Code Blocks Found:', codeBlocks ? codeBlocks.length : 0);
        console.log('Response Time:', pm.response.responseTime + 'ms');
        console.log('Token Usage:', JSON.stringify(codeGenResponse.usageMetadata, null, 2));
        
        if (codeBlocks) {
            console.log('First Code Block Preview:');
            console.log(codeBlocks[0].substring(0, 300) + '...');
        }
    }
}

pm.test('API Key Authentication Success', function () {
    pm.expect(pm.response.code).to.not.equal(401);
    pm.expect(pm.response.code).to.not.equal(403);
});

// Error handling
if (pm.response.code >= 400) {
    pm.test('Error Response Format', function () {
        var errorResponse = pm.response.json();
        pm.expect(errorResponse).to.have.property('error');
        console.error('=== API Error ===');
        console.error('Error:', JSON.stringify(errorResponse.error, null, 2));
    });
}


// ============================================================================
// 3. CHAT CONVERSATION COLLECTION - Complete Test Script
// ============================================================================

pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response is JSON', function () {
    pm.response.to.be.json;
});

var chatResponse;
try {
    chatResponse = pm.response.json();
} catch (e) {
    console.error('Failed to parse JSON response:', e);
    pm.test('Response parsing failed', function() {
        pm.expect.fail('Invalid JSON response');
    });
}

if (chatResponse) {
    // Core validation
    pm.test('Valid Gemini API Response Structure', function () {
        pm.expect(chatResponse).to.have.property('candidates');
        pm.expect(chatResponse.candidates).to.be.an('array');
        pm.expect(chatResponse.candidates.length).to.be.above(0);
        pm.expect(chatResponse.candidates[0]).to.have.property('content');
        pm.expect(chatResponse.candidates[0].content).to.have.property('parts');
    });

    // Chat-specific validation
    pm.test('Chat Response Quality', function () {
        var text = chatResponse.candidates[0].content.parts[0].text;
        pm.expect(text).to.be.a('string');
        pm.expect(text.length).to.be.above(20);
        pm.expect(text.trim()).to.not.be.empty;
    });

    pm.test('Conversational Tone Check', function () {
        var text = chatResponse.candidates[0].content.parts[0].text;
        pm.expect(text).to.not.match(/^(Error|Failed|Cannot process|Unable to|Invalid)/i);
        pm.expect(text.length).to.be.below(10000);
    });

    // Context preservation - save response for next turn
    pm.test('Save Assistant Response for Context', function () {
        var assistantResponse = chatResponse.candidates[0].content.parts[0].text;
        pm.environment.set('assistant_previous_response', assistantResponse);
        console.log('Saved assistant response to environment (length: ' + assistantResponse.length + ')');
    });

    // Save conversation history if needed
    pm.test('Update Conversation History', function () {
        var currentHistory = pm.environment.get('conversation_history');
        var assistantResponse = chatResponse.candidates[0].content.parts[0].text;
        
        var history = [];
        if (currentHistory) {
            try {
                history = JSON.parse(currentHistory);
            } catch (e) {
                console.warn('Could not parse existing history, starting fresh');
            }
        }
        
        history.push({
            role: 'model',
            parts: [{ text: assistantResponse }],
            timestamp: new Date().toISOString()
        });
        
        if (history.length > 20) {
            history = history.slice(-20);
        }
        
        pm.environment.set('conversation_history', JSON.stringify(history));
        console.log('Conversation history updated (total turns: ' + history.length + ')');
    });

    pm.test('Usage Metadata Present', function () {
        pm.expect(chatResponse).to.have.property('usageMetadata');
        pm.expect(chatResponse.usageMetadata).to.have.property('totalTokenCount');
    });

    pm.test('Finish Reason Valid', function () {
        var finishReason = chatResponse.candidates[0].finishReason;
        pm.expect(finishReason).to.be.oneOf(['STOP', 'MAX_TOKENS', 'SAFETY', 'OTHER']);
    });

    // Safety check for chat
    pm.test('Safety Ratings Check', function () {
        if (chatResponse.candidates[0].safetyRatings) {
            pm.expect(chatResponse.candidates[0].safetyRatings).to.be.an('array');
            
            var unsafeRatings = chatResponse.candidates[0].safetyRatings.filter(function(rating) {
                return rating.probability === 'HIGH' || rating.probability === 'MEDIUM';
            });
            
            if (unsafeRatings.length > 0) {
                console.warn('WARNING: Content safety warnings detected:');
                unsafeRatings.forEach(function(rating) {
                    console.warn('  -', rating.category, ':', rating.probability);
                });
            }
        }
    });

    pm.test('API Response Performance', function () {
        pm.expect(pm.response.responseTime).to.be.below(30000);
    });

    // Debug logging
    if (pm.environment.get('debug_mode') === 'true') {
        console.log('=== Chat Debug Info ===');
        console.log('Response Time:', pm.response.responseTime + 'ms');
        console.log('Token Usage:', JSON.stringify(chatResponse.usageMetadata, null, 2));
        console.log('Response Preview:', chatResponse.candidates[0].content.parts[0].text.substring(0, 150) + '...');
        console.log('Finish Reason:', chatResponse.candidates[0].finishReason);
    }
}

pm.test('API Key Authentication Success', function () {
    pm.expect(pm.response.code).to.not.equal(401);
    pm.expect(pm.response.code).to.not.equal(403);
});

// Error handling
if (pm.response.code >= 400) {
    pm.test('Error Response Format', function () {
        var errorResponse = pm.response.json();
        pm.expect(errorResponse).to.have.property('error');
        console.error('=== Chat API Error ===');
        console.error('Error:', JSON.stringify(errorResponse.error, null, 2));
    });
}


// ============================================================================
// 4. VISION/IMAGE ANALYSIS COLLECTION - Complete Test Script
// ============================================================================

pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response is JSON', function () {
    pm.response.to.be.json;
});

var visionResponse;
try {
    visionResponse = pm.response.json();
} catch (e) {
    console.error('Failed to parse JSON response:', e);
    pm.test('Response parsing failed', function() {
        pm.expect.fail('Invalid JSON response');
    });
}

if (visionResponse) {
    // Core validation
    pm.test('Valid Gemini API Response Structure', function () {
        pm.expect(visionResponse).to.have.property('candidates');
        pm.expect(visionResponse.candidates).to.be.an('array');
        pm.expect(visionResponse.candidates.length).to.be.above(0);
        pm.expect(visionResponse.candidates[0]).to.have.property('content');
    });

    // Vision-specific validation
    pm.test('Image Analysis Quality', function () {
        var text = visionResponse.candidates[0].content.parts[0].text;
        pm.expect(text).to.be.a('string');
        pm.expect(text.length).to.be.above(50);

        var visualKeywords = [
            'image', 'picture', 'photo', 'see', 'visible', 'show', 'display',
            'color', 'colour', 'shape', 'object', 'person', 'people', 'background',
            'foreground', 'contain', 'depict', 'appear', 'feature', 'scene',
            'view', 'showing', 'illustrate', 'present', 'red', 'blue', 'green',
            'black', 'white', 'large', 'small', 'left', 'right', 'center', 'top', 'bottom'
        ];

        var textLower = text.toLowerCase();
        var foundKeywords = visualKeywords.filter(function(keyword) {
            return textLower.includes(keyword);
        });
        
        pm.expect(foundKeywords.length, 'Should contain visual descriptive terms').to.be.above(2);
        
        if (pm.environment.get('debug_mode') === 'true') {
            console.log('Visual keywords found:', foundKeywords.join(', '));
        }
    });

    pm.test('Descriptive Content Adequate', function () {
        var text = visionResponse.candidates[0].content.parts[0].text;
        pm.expect(text.trim().length).to.be.above(30);
        var sentences = text.split(/[.!?]+/).filter(function(s) {
            return s.trim().length > 0;
        });
        pm.expect(sentences.length, 'Should have multiple sentences').to.be.above(1);
    });

    pm.test('No Placeholder Response', function () {
        var text = visionResponse.candidates[0].content.parts[0].text;
        var placeholders = ['[placeholder]', 'coming soon', 'not available', 'cannot see'];
        var hasPlaceholder = placeholders.some(function(ph) {
            return text.toLowerCase().includes(ph);
        });
        pm.expect(hasPlaceholder, 'Should not contain placeholder text').to.be.false;
    });

    pm.test('Usage Metadata Present', function () {
        pm.expect(visionResponse).to.have.property('usageMetadata');
        pm.expect(visionResponse.usageMetadata).to.have.property('totalTokenCount');
        pm.expect(visionResponse.usageMetadata.totalTokenCount).to.be.above(0);
    });

    pm.test('Finish Reason Valid', function () {
        var finishReason = visionResponse.candidates[0].finishReason;
        pm.expect(finishReason).to.be.oneOf(['STOP', 'MAX_TOKENS', 'SAFETY', 'OTHER']);
    });

    pm.test('API Response Performance (Vision)', function () {
        var timeout = parseInt(pm.environment.get('vision_timeout')) || 45000;
        pm.expect(pm.response.responseTime).to.be.below(timeout);
    });

    // Validate vision-capable model
    pm.test('Vision-Capable Model Confirmation', function () {
        var modelUsed = visionResponse.modelVersion || pm.variables.get('vision_model_name') || pm.environment.get('vision_model_name');
        
        if (modelUsed) {
            console.log('Model Used:', modelUsed);
            var visionModels = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro-vision', 'gemini-2.0-flash-exp'];
            var isVisionModel = visionModels.some(function(model) {
                return modelUsed.includes(model);
            });
            pm.expect(isVisionModel, 'Should use vision-capable model').to.be.true;
        }
    });

    // Safety ratings
    pm.test('Safety Ratings for Visual Content', function () {
        if (visionResponse.candidates[0].safetyRatings) {
            pm.expect(visionResponse.candidates[0].safetyRatings).to.be.an('array');
            
            var safetyIssues = visionResponse.candidates[0].safetyRatings.filter(function(rating) {
                return rating.probability === 'HIGH';
            });
            
            if (safetyIssues.length > 0) {
                console.warn('WARNING: Safety concerns detected in image:');
                safetyIssues.forEach(function(issue) {
                    console.warn('  -', issue.category, ':', issue.probability);
                });
            }
        }
    });

    // Debug logging
    if (pm.environment.get('debug_mode') === 'true') {
        console.log('=== Vision Analysis Debug Info ===');
        console.log('Response Time:', pm.response.responseTime + 'ms');
        console.log('Analysis Length:', visionResponse.candidates[0].content.parts[0].text.length);
        console.log('Token Usage:', JSON.stringify(visionResponse.usageMetadata, null, 2));
        console.log('Model Version:', visionResponse.modelVersion || 'Not specified');
        console.log('\nAnalysis Preview:');
        console.log(visionResponse.candidates[0].content.parts[0].text.substring(0, 300) + '...');
    }
}

pm.test('API Key Authentication Success', function () {
    pm.expect(pm.response.code).to.not.equal(401);
    pm.expect(pm.response.code).to.not.equal(403);
});

// Error handling
if (pm.response.code >= 400) {
    pm.test('Error Response Format', function () {
        var errorResponse = pm.response.json();
        pm.expect(errorResponse).to.have.property('error');
        console.error('=== Vision API Error ===');
        console.error('Error:', JSON.stringify(errorResponse.error, null, 2));
        
        if (errorResponse.error.message) {
            if (errorResponse.error.message.includes('image')) {
                console.error('TIP: Check that base64_image_data is properly formatted');
            }
            if (errorResponse.error.message.includes('model')) {
                console.error('TIP: Ensure you are using a vision-capable model');
            }
        }
    });
}


// ============================================================================
// 5. COLLECTION-LEVEL TESTS (Pre-request Script for entire collection)
// Use this in the Collection's "Pre-request Script" tab
// ============================================================================

// Initialize environment variables if not set
if (!pm.environment.get('base_url')) {
    pm.environment.set('base_url', 'https://generativelanguage.googleapis.com');
}

if (!pm.environment.get('api_version')) {
    pm.environment.set('api_version', 'v1beta');
}

if (!pm.environment.get('model_name')) {
    pm.environment.set('model_name', 'gemini-1.5-pro');
}

if (!pm.environment.get('chat_model_name')) {
    pm.environment.set('chat_model_name', 'gemini-1.5-pro');
}

if (!pm.environment.get('vision_model_name')) {
    pm.environment.set('vision_model_name', 'gemini-1.5-pro');
}

// Check API key
if (!pm.environment.get('GEMINI_API_KEY')) {
    console.error('ERROR: GEMINI_API_KEY not set in environment!');
    console.error('Please set your API key before running requests.');
}

// Log request info in debug mode
if (pm.environment.get('debug_mode') === 'true') {
    console.log('=== Request Info ===');
    console.log('Request:', pm.request.name || 'Unnamed');
    console.log('Method:', pm.request.method);
    console.log('URL:', pm.request.url.toString());
    console.log('Timestamp:', new Date().toISOString());
}


// ============================================================================
// 6. GLOBAL ERROR HANDLER (Add to Collection Tests)
// Use this in the Collection's "Tests" tab for all requests
// ============================================================================

// Global timeout handling
if (pm.response.code === 408 || pm.response.code === 504) {
    console.error('ERROR: Request timeout detected');
    console.error('Consider increasing timeout or checking network connectivity');
}

// Global rate limit monitoring
var globalRateLimitRemaining = pm.response.headers.get('X-RateLimit-Remaining');
var globalRateLimitReset = pm.response.headers.get('X-RateLimit-Reset');

if (globalRateLimitRemaining !== null) {
    var remaining = parseInt(globalRateLimitRemaining);
    console.log('Rate Limit Status: ' + remaining + ' requests remaining');
    
    if (remaining < 10) {
        console.warn('WARNING: Rate limit running low! Only ' + remaining + ' requests left');
    }
    
    if (remaining === 0) {
        console.error('ERROR: Rate limit exceeded!');
        if (globalRateLimitReset) {
            console.error('Reset at:', new Date(parseInt(globalRateLimitReset) * 1000).toISOString());
        }
    }
}

// Global error logging
if (pm.response.code >= 400) {
    console.error('=== Request Failed ===');
    console.error('Status Code:', pm.response.code);
    console.error('Status Text:', pm.response.status);
    console.error('Request:', pm.request.name || 'Unnamed');
    
    try {
        var globalErrorBody = pm.response.json();
        if (globalErrorBody.error) {
            console.error('Error Message:', globalErrorBody.error.message);
            console.error('Error Code:', globalErrorBody.error.code);
            
            // Common error solutions
            if (pm.response.code === 401) {
                console.error('SOLUTION: Check your GEMINI_API_KEY is correct and active');
            } else if (pm.response.code === 403) {
                console.error('SOLUTION: Verify API key has required permissions');
            } else if (pm.response.code === 429) {
                console.error('SOLUTION: Rate limit exceeded, wait before retrying');
            } else if (pm.response.code === 400) {
                console.error('SOLUTION: Check request body format and required fields');
            } else if (pm.response.code === 404) {
                console.error('SOLUTION: Verify model name and API endpoint URL');
            }
        }
    } catch (e) {
        console.error('Could not parse error response');
    }
}