#!/usr/bin/env node

/**
 * Workspace Update Script
 * Automatically updates collections and environments based on API changes
 */

const fs = require('fs');
const path = require('path');

class WorkspaceUpdater {
    constructor() {
        this.collectionsDir = path.join(__dirname, '../collections');
        this.environmentsDir = path.join(__dirname, '../environments');
        this.updateReport = this.loadUpdateReport();
    }

    loadUpdateReport() {
        try {
            const reportPath = path.join(__dirname, '../update-report.json');
            if (fs.existsSync(reportPath)) {
                return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not load update report:', error.message);
        }
        return { changes: [], newModels: [], deprecatedModels: [] };
    }

    async updateCollections() {
        console.log('Updating collections...');

        const collections = this.getCollectionFiles();

        for (const collectionFile of collections) {
            await this.updateCollection(collectionFile);
        }
    }

    async updateEnvironments() {
        console.log('Updating environments...');

        const environments = this.getEnvironmentFiles();

        for (const envFile of environments) {
            await this.updateEnvironment(envFile);
        }
    }

    getCollectionFiles() {
        return fs.readdirSync(this.collectionsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => path.join(this.collectionsDir, file));
    }

    getEnvironmentFiles() {
        return fs.readdirSync(this.environmentsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => path.join(this.environmentsDir, file));
    }

    async updateCollection(filePath) {
        try {
            const collection = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            let updated = false;

            // Update model references
            if (this.updateReport.newModels.length > 0) {
                updated = this.addNewModelSupport(collection) || updated;
            }

            // Remove deprecated models
            if (this.updateReport.deprecatedModels.length > 0) {
                updated = this.removeDeprecatedModels(collection) || updated;
            }

            // Update test scripts
            updated = this.updateTestScripts(collection) || updated;

            // Update request examples
            updated = this.updateRequestExamples(collection) || updated;

            // Update collection metadata
            collection.info.version = this.incrementVersion(collection.info.version || '1.0.0');
            collection.info.updatedAt = new Date().toISOString();

            if (updated) {
                fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
                console.log(`✅ Updated collection: ${path.basename(filePath)}`);
            } else {
                console.log(`ℹ️  No changes needed: ${path.basename(filePath)}`);
            }

        } catch (error) {
            console.error(`❌ Error updating ${filePath}:`, error.message);
        }
    }

    addNewModelSupport(collection) {
        let updated = false;

        const newModelNames = this.updateReport.newModels.map(m => m.name);

        // Add new models to collection variables
        if (collection.variable) {
            const modelVars = collection.variable.filter(v =>
                v.key.includes('model') && !v.key.includes('_name')
            );

            for (const newModel of this.updateReport.newModels) {
                const modelName = newModel.name.split('/').pop(); // Extract model name from path

                // Add new model variable if it doesn't exist
                const varName = `${modelName.replace(/-/g, '_')}_model`;
                const existingVar = collection.variable.find(v => v.key === varName);

                if (!existingVar) {
                    collection.variable.push({
                        key: varName,
                        value: modelName,
                        type: 'string',
                        description: `Model: ${newModel.displayName || modelName}`
                    });
                    updated = true;
                }
            }
        }

        return updated;
    }

    removeDeprecatedModels(collection) {
        let updated = false;
        const deprecatedNames = this.updateReport.deprecatedModels.map(m => m.name);

        // Update collection variables
        if (collection.variable) {
            collection.variable = collection.variable.filter(variable => {
                const isDeprecated = deprecatedNames.some(name =>
                    variable.value && variable.value.includes(name.split('/').pop())
                );

                if (isDeprecated) {
                    console.log(`Removing deprecated model variable: ${variable.key}`);
                    updated = true;
                    return false;
                }
                return true;
            });
        }

        // Update requests that use deprecated models
        this.updateItemsRecursively(collection.item, (item) => {
            if (item.request && item.request.url) {
                const url = typeof item.request.url === 'string' ?
                    item.request.url : item.request.url.raw;

                for (const deprecatedModel of deprecatedNames) {
                    const modelName = deprecatedModel.split('/').pop();
                    if (url.includes(modelName)) {
                        // Replace with gemini-1.5-pro as default
                        const newUrl = url.replace(modelName, 'gemini-1.5-pro');

                        if (typeof item.request.url === 'string') {
                            item.request.url = newUrl;
                        } else {
                            item.request.url.raw = newUrl;
                        }

                        updated = true;
                        console.log(`Updated deprecated model in request: ${item.name}`);
                    }
                }
            }
        });

        return updated;
    }

    updateTestScripts(collection) {
        let updated = false;

        this.updateItemsRecursively(collection.item, (item) => {
            if (item.event) {
                for (const event of item.event) {
                    if (event.listen === 'test' && event.script && event.script.exec) {
                        const scriptLines = Array.isArray(event.script.exec) ?
                            event.script.exec : [event.script.exec];

                        // Add new test validations
                        const newValidations = this.generateNewTestValidations();

                        if (newValidations.length > 0) {
                            scriptLines.push('', '// Auto-generated validations for new API features');
                            scriptLines.push(...newValidations);
                            event.script.exec = scriptLines;
                            updated = true;
                        }
                    }
                }
            }
        });

        return updated;
    }

    generateNewTestValidations() {
        const validations = [];

        // Add validations for new response fields
        const newFields = this.updateReport.parameterChanges
            .filter(change => change.type === 'new_response_fields')
            .flatMap(change => change.fields);

        for (const field of newFields) {
            validations.push(
                `pm.test('New field ${field} exists', function () {`,
                `    const response = pm.response.json();`,
                `    if (response.candidates && response.candidates[0] && response.candidates[0].${field}) {`,
                `        pm.expect(response.candidates[0].${field}).to.exist;`,
                `    }`,
                `});`
            );
        }

        return validations;
    }

    updateRequestExamples(collection) {
        let updated = false;

        this.updateItemsRecursively(collection.item, (item) => {
            if (item.request && item.request.body && item.request.body.raw) {
                try {
                    const body = JSON.parse(item.request.body.raw);

                    // Update generation config with new parameters
                    if (body.generationConfig) {
                        const originalConfig = JSON.stringify(body.generationConfig);

                        // Add new recommended parameters
                        this.updateGenerationConfig(body.generationConfig);

                        if (JSON.stringify(body.generationConfig) !== originalConfig) {
                            item.request.body.raw = JSON.stringify(body, null, 2);
                            updated = true;
                        }
                    }

                } catch (error) {
                    // Skip if not valid JSON
                }
            }
        });

        return updated;
    }

    updateGenerationConfig(config) {
        // Add stopSequences if not present (new recommended parameter)
        if (!config.stopSequences) {
            config.stopSequences = [];
        }

        // Ensure candidateCount is set to 1 (API default)
        if (!config.candidateCount) {
            config.candidateCount = 1;
        }

        // Update temperature range validation
        if (config.temperature > 2.0) {
            config.temperature = 2.0;
            console.log('Clamped temperature to maximum value of 2.0');
        }
    }

    async updateEnvironment(filePath) {
        try {
            const environment = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            let updated = false;

            // Add new model variables
            if (this.updateReport.newModels.length > 0) {
                for (const newModel of this.updateReport.newModels) {
                    const modelName = newModel.name.split('/').pop();
                    const varName = `${modelName.replace(/-/g, '_')}_model`;

                    const existingVar = environment.values.find(v => v.key === varName);

                    if (!existingVar) {
                        environment.values.push({
                            key: varName,
                            value: modelName,
                            description: `New model: ${newModel.displayName || modelName}`,
                            type: 'default',
                            enabled: true
                        });
                        updated = true;
                    }
                }
            }

            // Remove deprecated model variables
            if (this.updateReport.deprecatedModels.length > 0) {
                const deprecatedNames = this.updateReport.deprecatedModels.map(m =>
                    m.name.split('/').pop()
                );

                environment.values = environment.values.filter(variable => {
                    const isDeprecated = deprecatedNames.some(name =>
                        variable.value && variable.value.includes(name)
                    );

                    if (isDeprecated) {
                        console.log(`Removing deprecated model from environment: ${variable.key}`);
                        updated = true;
                        return false;
                    }
                    return true;
                });
            }

            // Update API version if needed
            const apiVersionVar = environment.values.find(v => v.key === 'api_version');
            if (apiVersionVar && this.shouldUpdateApiVersion()) {
                apiVersionVar.value = 'v1'; // Update to stable version when available
                updated = true;
            }

            if (updated) {
                fs.writeFileSync(filePath, JSON.stringify(environment, null, 2));
                console.log(`✅ Updated environment: ${path.basename(filePath)}`);
            } else {
                console.log(`ℹ️  No changes needed: ${path.basename(filePath)}`);
            }

        } catch (error) {
            console.error(`❌ Error updating ${filePath}:`, error.message);
        }
    }

    shouldUpdateApiVersion() {
        return this.updateReport.changes.some(change =>
            change.type === 'new_api_version' && change.version === 'v1'
        );
    }

    updateItemsRecursively(items, callback) {
        if (!Array.isArray(items)) return;

        for (const item of items) {
            callback(item);

            if (item.item) {
                this.updateItemsRecursively(item.item, callback);
            }
        }
    }

    incrementVersion(version) {
        const parts = version.split('.').map(Number);
        parts[2] = (parts[2] || 0) + 1; // Increment patch version
        return parts.join('.');
    }

    async generateChangeLog() {
        const changelogPath = path.join(__dirname, '../CHANGELOG.md');
        let changelog = '';

        if (fs.existsSync(changelogPath)) {
            changelog = fs.readFileSync(changelogPath, 'utf8');
        } else {
            changelog = '# Changelog\\n\\nAll notable changes to this workspace will be documented in this file.\\n\\n';
        }

        const today = new Date().toISOString().split('T')[0];
        const newEntry = this.generateChangelogEntry(today);

        // Insert new entry after the header
        const lines = changelog.split('\\n');
        const insertIndex = lines.findIndex(line => line.startsWith('## ')) || lines.length;

        lines.splice(insertIndex, 0, newEntry, '');

        fs.writeFileSync(changelogPath, lines.join('\\n'));
        console.log('✅ Updated CHANGELOG.md');
    }

    generateChangelogEntry(date) {
        const version = this.incrementVersion('1.0.0'); // Get from package.json in real implementation
        let entry = `## [${version}] - ${date}\\n`;

        if (this.updateReport.newModels.length > 0) {
            entry += '\\n### Added\\n';
            for (const model of this.updateReport.newModels) {
                entry += `- Support for ${model.displayName || model.name}\\n`;
            }
        }

        if (this.updateReport.deprecatedModels.length > 0) {
            entry += '\\n### Removed\\n';
            for (const model of this.updateReport.deprecatedModels) {
                entry += `- Deprecated model ${model.name}\\n`;
            }
        }

        if (this.updateReport.parameterChanges.length > 0) {
            entry += '\\n### Changed\\n';
            entry += '- Updated test scripts with new API validations\\n';
        }

        entry += '\\n### Maintenance\\n';
        entry += '- Automated workspace update via GitHub Actions\\n';
        entry += '- Refreshed documentation and examples\\n';

        return entry;
    }

    async run() {
        try {
            console.log('🔄 Starting workspace update...');

            await this.updateCollections();
            await this.updateEnvironments();
            await this.generateChangeLog();

            console.log('✅ Workspace update completed successfully!');

        } catch (error) {
            console.error('❌ Workspace update failed:', error.message);
            process.exit(1);
        }
    }
}

// Main execution
async function main() {
    const updater = new WorkspaceUpdater();
    await updater.run();
}

if (require.main === module) {
    main();
}

module.exports = WorkspaceUpdater;