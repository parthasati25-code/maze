/**
 * ============================================================================
 * PROJECT: MazeMaster — DSAL End-Term Project
 * FILE: backend/server.js
 *
 * DESCRIPTION:
 * Node.js alternative bridge server using ONLY core modules (http, fs, path, child_process).
 * Can be run via: `node backend/server.js`
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8000;
const BACKEND_DIR = __dirname;
const PROJECT_DIR = path.dirname(BACKEND_DIR);
const FRONTEND_DIR = path.join(PROJECT_DIR, 'frontend');
const SOLVER_EXE = path.join(BACKEND_DIR, process.platform === 'win32' ? 'solver.exe' : 'solver');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/api/health') {
        const exists = fs.existsSync(SOLVER_EXE);
        res.writeHead(exists ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            backend: 'C++ Native Executable (via Node.js bridge)',
            solverPath: SOLVER_EXE,
            executableFound: exists,
            message: exists ? 'C++ Backend Ready' : 'solver.exe not found! Run compile.bat.'
        }));
        return;
    }

    if (req.method === 'GET' && req.url === '/api/original-code') {
        const codePath = path.join(BACKEND_DIR, 'original_code.cpp');
        fs.readFile(codePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'original_code.cpp not found' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: data }));
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/api/backend-code') {
        const codePath = path.join(BACKEND_DIR, 'solver.cpp');
        fs.readFile(codePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'solver.cpp not found' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: data }));
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/api/solve') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            if (!fs.existsSync(SOLVER_EXE)) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    status: 'EXECUTABLE_NOT_FOUND',
                    message: 'solver.exe is missing. Please compile solver.cpp first.'
                }));
                return;
            }

            const child = spawn(SOLVER_EXE);
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', data => { stdout += data.toString(); });
            child.stderr.on('data', data => { stderr += data.toString(); });

            child.on('close', code => {
                try {
                    const parsed = JSON.parse(stdout);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(parsed));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        status: 'PROCESS_ERROR',
                        message: `Failed to parse solver output: ${stdout || stderr}`
                    }));
                }
            });

            child.stdin.write(body);
            child.stdin.end();
        });
        return;
    }

    // Static file serving
    let filePath = path.join(FRONTEND_DIR, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`MazeMaster Node server running at http://localhost:${PORT}`);
});
