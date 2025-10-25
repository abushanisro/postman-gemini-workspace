#!/usr/bin/env node

/**
 * API Update Checker
 * Monitors Gemini API for changes and updates workspace accordingly
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class APIUpdateChecker {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com';
        this.currentState = this.loadCurrentState();
        this.updateReport = {
            timestamp: new Date().toISOString(),
            changes: [],
            newModels: [],
            deprecatedModels: [],
            parameterChanges: [],
            recommendations: []
        };
    }

    loadCurrentState() {
        const statePath = path.join(__dirname, '../.workspace-state.json');

        if (fs.existsSync(statePath)) {
            return JSON.parse(fs.readFileSync(statePath, 'utf8'));
        }

        return {
            models: [],
            lastUpdate: null,
            version: '1.0.0'
        };
    }

    saveCurrentState(newState) {
        const statePath = path.join(__dirname, '../.workspace-state.json');
        fs.writeFileSync(statePath, JSON.stringify(newState, null, 2));
    }

    async makeApiRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${endpoint}?key=${this.apiKey}`;

            https.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    async checkForUpdates() {
        try {
            console.log('Checking Gemini API for updates...');

            // Get current models
            const modelsResponse = await this.makeApiRequest('/v1beta/models');

            if (modelsResponse.error) {
                throw new Error(`API Error: ${modelsResponse.error.message}`);
            }

            const currentModels = modelsResponse.models || [];
            this.analyzeModelChanges(currentModels);

            // Check for parameter changes by testing a simple request
            await this.checkParameterChanges();

            // Check API version changes
            await this.checkVersionChanges();

            // Generate recommendations
            this.generateRecommendations();

            // Save new state
            const newState = {
                models: currentModels,
                lastUpdate: new Date().toISOString(),
                version: this.currentState.version
            };
            this.saveCurrentState(newState);

            return this.updateReport;

        } catch (error) {
            console.error('Error checking for updates:', error.message);
            throw error;
        }
    }

    analyzeModelChanges(currentModels) {
        const previousModels = this.currentState.models || [];
        const previousModelNames = previousModels.map(m => m.name);
        const currentModelNames = currentModels.map(m => m.name);

        // Find new models
        const newModels = currentModels.filter(m =>
            !previousModelNames.includes(m.name)
        );

        // Find deprecated models
        const deprecatedModels = previousModels.filter(m =>
            !currentModelNames.includes(m.name)
        );

        // Find models with changed properties
        const changedModels = currentModels.filter(currentModel => {
            const previousModel = previousModels.find(m => m.name === currentModel.name);
            if (!previousModel) return false;

            return JSON.stringify(currentModel) !== JSON.stringify(previousModel);
        });

        if (newModels.length > 0) {
            this.updateReport.newModels = newModels;
            this.updateReport.changes.push({
                type: 'new_models',
                count: newModels.length,
                details: newModels.map(m => ({
                    name: m.name,
                    displayName: m.displayName,
                    description: m.description
                }))
            });
        }

        if (deprecatedModels.length > 0) {
            this.updateReport.deprecatedModels = deprecatedModels;
            this.updateReport.changes.push({
                type: 'deprecated_models',
                count: deprecatedModels.length,
                details: deprecatedModels.map(m => m.name)
            });
        }

        if (changedModels.length > 0) {
            this.updateReport.changes.push({
                type: 'model_changes',
                count: changedModels.length,
                details: changedModels.map(m => m.name)
            });
        }
    }

    async checkParameterChanges() {
        try {
            // Test with a simple request to see if new parameters are supported
            const testRequest = {
                contents: [
                    {
                        parts: [
                            {
                                text: "Hello"
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 10
                }
            };

            // Test against a known model
            const testModel = 'gemini-1.5-pro';
            const response = await this.makeApiRequest(`/v1beta/models/${testModel}:generateContent`);

            // Analyze response structure for new fields
            if (response.candidates && response.candidates[0]) {
                const candidate = response.candidates[0];

                // Check for new fields in the response
                const knownFields = ['content', 'finishReason', 'index', 'safetyRatings'];
                const responseFields = Object.keys(candidate);
                const newFields = responseFields.filter(field => !knownFields.includes(field));

                if (newFields.length > 0) {
                    this.updateReport.parameterChanges.push({
                        type: 'new_response_fields',
                        fields: newFields
                    });
                }
            }

        } catch (error) {
            console.warn('Could not check parameter changes:', error.message);
        }
    }

    async checkVersionChanges() {
        // Check if there are new API versions available
        try {
            // Try to access v1 (stable) endpoint
            const v1Response = await this.makeApiRequest('/v1/models').catch(() => null);

            if (v1Response && !v1Response.error) {
                this.updateReport.changes.push({
                    type: 'new_api_version',
                    version: 'v1',
                    status: 'stable_version_available'
                });
            }
        } catch (error) {
            // v1 not available yet
        }
    }

    generateRecommendations() {
        const recommendations = [];

        // Recommend updating to new models
        if (this.updateReport.newModels.length > 0) {
            recommendations.push({
                type: 'update_models',
                priority: 'medium',
                description: 'New models are available. Consider updating your collections to include these models.',
                action: 'Add new model options to environment variables'
            });
        }

        // Warn about deprecated models
        if (this.updateReport.deprecatedModels.length > 0) {
            recommendations.push({
                type: 'deprecated_models',
                priority: 'high',
                description: 'Some models have been deprecated. Update your collections to use supported models.',
                action: 'Replace deprecated model references in collections'
            });
        }

        // Recommend parameter updates
        if (this.updateReport.parameterChanges.length > 0) {
            recommendations.push({
                type: 'parameter_updates',
                priority: 'low',
                description: 'New response fields or parameters are available.',
                action: 'Update test scripts to validate new fields'
            });
        }

        // General maintenance recommendations
        if (this.currentState.lastUpdate) {
            const daysSinceUpdate = (Date.now() - new Date(this.currentState.lastUpdate)) / (1000 * 60 * 60 * 24);

            if (daysSinceUpdate > 30) {
                recommendations.push({
                    type: 'maintenance',
                    priority: 'medium',
                    description: 'Workspace has not been updated in over 30 days.',
                    action: 'Review and refresh all collections and documentation'
                });
            }
        }

        this.updateReport.recommendations = recommendations;
    }

    hasSignificantChanges() {
        return this.updateReport.changes.length > 0 ||
               this.updateReport.recommendations.some(r => r.priority === 'high');
    }

    generateSummary() {
        const summary = {
            hasUpdates: this.hasSignificantChanges(),
            changeCount: this.updateReport.changes.length,
            highPriorityRecommendations: this.updateReport.recommendations.filter(r => r.priority === 'high').length,
            summary: `Found ${this.updateReport.changes.length} changes and ${this.updateReport.recommendations.length} recommendations`
        };

        return summary;
    }
}

// Main execution
async function main() {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY environment variable is required');
        process.exit(1);
    }

    try {
        const checker = new APIUpdateChecker();
        const report = await checker.checkForUpdates();

        // Output report for GitHub Actions
        if (checker.hasSignificantChanges()) {
            console.log(JSON.stringify(report, null, 2));
        }

        // Exit with appropriate code
        process.exit(checker.hasSignificantChanges() ? 0 : 1);

    } catch (error) {
        console.error('Update check failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = APIUpdateChecker;