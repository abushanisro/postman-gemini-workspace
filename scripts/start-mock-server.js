#!/usr/bin/env node

/**
 * Mock Server Starter Script
 * Manages the lifecycle of the Gemini mock server
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MockServerManager {
    constructor() {
        this.serverProcess = null;
        this.pidFile = path.join(__dirname, '../mocks/.server.pid');
        this.logFile = path.join(__dirname, '../mocks/server.log');
    }

    start(options = {}) {
        const port = options.port || process.env.MOCK_SERVER_PORT || 3000;

        if (this.isRunning()) {
            console.log('Mock server is already running');
            this.status();
            return;
        }

        console.log(`Starting Gemini mock server on port ${port}...`);

        const serverScript = path.join(__dirname, '../mocks/gemini-mock-server.js');

        // Check if dependencies are installed
        if (!this.checkDependencies()) {
            console.log('Installing dependencies...');
            this.installDependencies();
        }

        // Start server process
        this.serverProcess = spawn('node', [serverScript], {
            env: { ...process.env, MOCK_SERVER_PORT: port },
            detached: options.daemon || false,
            stdio: options.daemon ? ['ignore', 'pipe', 'pipe'] : 'inherit'
        });

        if (options.daemon) {
            // Daemon mode - run in background
            this.setupDaemonMode();
        } else {
            // Interactive mode
            this.setupInteractiveMode();
        }
    }

    setupDaemonMode() {
        // Save PID for later management
        fs.writeFileSync(this.pidFile, this.serverProcess.pid.toString());

        // Setup logging
        const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
        this.serverProcess.stdout.pipe(logStream);
        this.serverProcess.stderr.pipe(logStream);

        this.serverProcess.unref();

        console.log(`Mock server started in daemon mode (PID: ${this.serverProcess.pid})`);
        console.log(`Logs: ${this.logFile}`);

        // Give server time to start
        setTimeout(() => {
            this.status();
        }, 2000);
    }

    setupInteractiveMode() {
        console.log('Mock server started in interactive mode');
        console.log('Press Ctrl+C to stop the server');

        // Handle cleanup on exit
        process.on('SIGINT', () => {
            console.log('\\nShutting down mock server...');
            this.stop();
            process.exit(0);
        });

        this.serverProcess.on('exit', (code) => {
            console.log(`Mock server exited with code ${code}`);
        });
    }

    stop() {
        if (!this.isRunning()) {
            console.log('Mock server is not running');
            return;
        }

        const pid = this.getPid();

        try {
            process.kill(pid, 'SIGTERM');
            console.log(`Mock server stopped (PID: ${pid})`);

            // Clean up PID file
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        } catch (error) {
            console.error('Error stopping server:', error.message);
        }
    }

    restart(options = {}) {
        console.log('Restarting mock server...');
        this.stop();

        // Wait a bit before restarting
        setTimeout(() => {
            this.start(options);
        }, 1000);
    }

    status() {
        if (!this.isRunning()) {
            console.log('❌ Mock server is not running');
            return;
        }

        const pid = this.getPid();
        console.log(`✅ Mock server is running (PID: ${pid})`);

        // Try to get server info
        this.getServerInfo();
    }

    async getServerInfo() {
        try {
            const fetch = require('node-fetch');
            const response = await fetch('http://localhost:3000/health');
            const data = await response.json();

            console.log('📊 Server Status:');
            console.log(`   Status: ${data.status}`);
            console.log(`   Uptime: ${data.timestamp}`);
            console.log(`   Requests served: ${data.requests_served || 0}`);
        } catch (error) {
            console.log('⚠️  Could not retrieve server status');
        }
    }

    logs(options = {}) {
        if (!fs.existsSync(this.logFile)) {
            console.log('No log file found');
            return;
        }

        const tail = options.tail || false;
        const lines = options.lines || 50;

        if (tail) {
            console.log(`Tailing logs (${this.logFile}):`);
            const tailProcess = spawn('tail', ['-f', this.logFile], { stdio: 'inherit' });

            process.on('SIGINT', () => {
                tailProcess.kill();
                process.exit(0);
            });
        } else {
            console.log(`Last ${lines} lines from logs:`);
            const logContent = fs.readFileSync(this.logFile, 'utf8');
            const logLines = logContent.split('\\n').slice(-lines);
            console.log(logLines.join('\\n'));
        }
    }

    isRunning() {
        if (!fs.existsSync(this.pidFile)) {
            return false;
        }

        const pid = this.getPid();

        try {
            process.kill(pid, 0); // Check if process exists
            return true;
        } catch (error) {
            // Process doesn't exist, clean up stale PID file
            fs.unlinkSync(this.pidFile);
            return false;
        }
    }

    getPid() {
        if (!fs.existsSync(this.pidFile)) {
            return null;
        }

        return parseInt(fs.readFileSync(this.pidFile, 'utf8').trim());
    }

    checkDependencies() {
        const packageJson = path.join(__dirname, '../package.json');

        if (!fs.existsSync(packageJson)) {
            return false;
        }

        const nodeModules = path.join(__dirname, '../node_modules');
        return fs.existsSync(nodeModules);
    }

    installDependencies() {
        const { execSync } = require('child_process');

        try {
            execSync('npm install', {
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit'
            });
        } catch (error) {
            console.error('Failed to install dependencies:', error.message);
            process.exit(1);
        }
    }
}

// CLI interface
function main() {
    const manager = new MockServerManager();
    const command = process.argv[2];
    const options = {};

    // Parse command line options
    process.argv.slice(3).forEach(arg => {
        if (arg === '--daemon' || arg === '-d') {
            options.daemon = true;
        } else if (arg.startsWith('--port=')) {
            options.port = parseInt(arg.split('=')[1]);
        } else if (arg === '--tail' || arg === '-t') {
            options.tail = true;
        } else if (arg.startsWith('--lines=')) {
            options.lines = parseInt(arg.split('=')[1]);
        }
    });

    switch (command) {
        case 'start':
            manager.start(options);
            break;
        case 'stop':
            manager.stop();
            break;
        case 'restart':
            manager.restart(options);
            break;
        case 'status':
            manager.status();
            break;
        case 'logs':
            manager.logs(options);
            break;
        default:
            console.log('Gemini Mock Server Manager');
            console.log('');
            console.log('Usage: node start-mock-server.js <command> [options]');
            console.log('');
            console.log('Commands:');
            console.log('  start    Start the mock server');
            console.log('  stop     Stop the mock server');
            console.log('  restart  Restart the mock server');
            console.log('  status   Show server status');
            console.log('  logs     Show server logs');
            console.log('');
            console.log('Options:');
            console.log('  --daemon, -d      Run in daemon mode (background)');
            console.log('  --port=<port>     Specify port number (default: 3000)');
            console.log('  --tail, -t        Tail logs in real-time');
            console.log('  --lines=<n>       Number of log lines to show (default: 50)');
            console.log('');
            console.log('Examples:');
            console.log('  node start-mock-server.js start --daemon --port=3001');
            console.log('  node start-mock-server.js logs --tail');
            break;
    }
}

if (require.main === module) {
    main();
}

module.exports = MockServerManager;