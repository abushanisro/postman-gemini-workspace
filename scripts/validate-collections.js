#!/usr/bin/env node

/**
 * Collection Validation Script
 * Validates Postman collections for correctness and completeness
 */

const fs = require('fs');
const path = require('path');

class CollectionValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    validateCollection(filePath) {
        console.log(`Validating collection: ${filePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const collection = JSON.parse(content);

            this.validateSchema(collection, filePath);
            this.validateStructure(collection, filePath);
            this.validateRequests(collection, filePath);
            this.validateEnvironmentVariables(collection, filePath);
            this.validateTests(collection, filePath);

        } catch (error) {
            this.errors.push(`${filePath}: Invalid JSON - ${error.message}`);
        }
    }

    validateSchema(collection, filePath) {
        const requiredFields = ['info', 'item'];
        const missingFields = requiredFields.filter(field => !collection[field]);

        if (missingFields.length > 0) {
            this.errors.push(`${filePath}: Missing required fields: ${missingFields.join(', ')}`);
        }

        if (collection.info) {
            const requiredInfoFields = ['name', 'description'];
            const missingInfoFields = requiredInfoFields.filter(field => !collection.info[field]);

            if (missingInfoFields.length > 0) {
                this.warnings.push(`${filePath}: Missing recommended info fields: ${missingInfoFields.join(', ')}`);
            }
        }
    }

    validateStructure(collection, filePath) {
        if (!Array.isArray(collection.item)) {
            this.errors.push(`${filePath}: 'item' must be an array`);
            return;
        }

        collection.item.forEach((item, index) => {
            this.validateItem(item, `${filePath}[${index}]`);
        });
    }

    validateItem(item, path) {
        if (!item.name) {
            this.warnings.push(`${path}: Item missing name`);
        }

        if (item.request) {
            this.validateRequest(item.request, path);
        }

        if (item.item && Array.isArray(item.item)) {
            item.item.forEach((subItem, index) => {
                this.validateItem(subItem, `${path}.item[${index}]`);
            });
        }
    }

    validateRequest(request, path) {
        if (!request.method) {
            this.errors.push(`${path}: Request missing method`);
        }

        if (!request.url) {
            this.errors.push(`${path}: Request missing URL`);
        } else {
            this.validateUrl(request.url, path);
        }

        if (request.body && request.body.mode === 'raw') {
            this.validateRequestBody(request.body.raw, path);
        }
    }

    validateUrl(url, path) {
        if (typeof url === 'string') {
            // Simple string URL
            if (!url.includes('{{') && !url.startsWith('http')) {
                this.warnings.push(`${path}: URL should use environment variables or be absolute`);
            }
        } else if (typeof url === 'object') {
            // Structured URL object
            if (!url.raw) {
                this.errors.push(`${path}: URL object missing 'raw' field`);
            }
        }
    }

    validateRequestBody(body, path) {
        if (!body) return;

        try {
            // Check if it's valid JSON
            JSON.parse(body);
        } catch (error) {
            // Check if it contains variables (which would make it invalid JSON)
            if (!body.includes('{{')) {
                this.warnings.push(`${path}: Request body appears to be malformed JSON`);
            }
        }
    }

    validateRequests(collection, filePath) {
        const requests = this.extractRequests(collection);

        if (requests.length === 0) {
            this.warnings.push(`${filePath}: Collection contains no requests`);
        }

        // Check for duplicate request names
        const requestNames = requests.map(r => r.name).filter(Boolean);
        const duplicates = requestNames.filter((name, index) => requestNames.indexOf(name) !== index);

        if (duplicates.length > 0) {
            this.warnings.push(`${filePath}: Duplicate request names found: ${[...new Set(duplicates)].join(', ')}`);
        }
    }

    validateEnvironmentVariables(collection, filePath) {
        const content = JSON.stringify(collection);
        const variables = content.match(/{{([^}]+)}}/g) || [];
        const uniqueVars = [...new Set(variables)];

        console.log(`${filePath}: Found ${uniqueVars.length} environment variables:`, uniqueVars);

        // Check for common required variables
        const commonVars = ['{{GEMINI_API_KEY}}', '{{base_url}}', '{{api_version}}'];
        const missingCommonVars = commonVars.filter(varPattern => !content.includes(varPattern));

        if (missingCommonVars.length > 0) {
            this.warnings.push(`${filePath}: Missing common variables: ${missingCommonVars.join(', ')}`);
        }
    }

    validateTests(collection, filePath) {
        const requests = this.extractRequests(collection);
        const requestsWithoutTests = requests.filter(request => {
            const events = request.event || [];
            return !events.some(event => event.listen === 'test');
        });

        if (requestsWithoutTests.length > 0) {
            this.warnings.push(`${filePath}: ${requestsWithoutTests.length} requests without test scripts`);
        }

        // Validate test script syntax
        requests.forEach(request => {
            const testEvents = (request.event || []).filter(event => event.listen === 'test');
            testEvents.forEach(event => {
                if (event.script && event.script.exec) {
                    this.validateTestScript(event.script.exec, `${filePath}:${request.name}`);
                }
            });
        });
    }

    validateTestScript(scriptLines, path) {
        const script = Array.isArray(scriptLines) ? scriptLines.join('\n') : scriptLines;

        // Check for common test patterns
        if (!script.includes('pm.test')) {
            this.warnings.push(`${path}: Test script doesn't contain pm.test calls`);
        }

        // Check for syntax errors (basic check)
        try {
            new Function(script);
        } catch (error) {
            this.errors.push(`${path}: Test script syntax error - ${error.message}`);
        }
    }

    extractRequests(item) {
        const requests = [];

        if (item.request) {
            requests.push(item);
        }

        if (item.item && Array.isArray(item.item)) {
            item.item.forEach(subItem => {
                requests.push(...this.extractRequests(subItem));
            });
        }

        return requests;
    }

    printResults() {
        console.log('\n=== Validation Results ===');

        if (this.errors.length > 0) {
            console.log('\n ERRORS:');
            this.errors.forEach(error => console.log(`  ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n WARNINGS:');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('\n All collections are valid!');
        }

        console.log(`\nSummary: ${this.errors.length} errors, ${this.warnings.length} warnings`);

        return this.errors.length === 0;
    }
}

// Main execution
function main() {
    const validator = new CollectionValidator();
    const collectionsDir = path.join(__dirname, '../collections');

    if (!fs.existsSync(collectionsDir)) {
        console.error('Collections directory not found:', collectionsDir);
        process.exit(1);
    }

    const files = fs.readdirSync(collectionsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(collectionsDir, file));

    if (files.length === 0) {
        console.error('No JSON files found in collections directory');
        process.exit(1);
    }

    files.forEach(file => validator.validateCollection(file));

    const isValid = validator.printResults();
    process.exit(isValid ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = CollectionValidator;