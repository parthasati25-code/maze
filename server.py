#!/usr/bin/env python3
"""
============================================================================
PROJECT: MazeMaster — DSAL End-Term Project
FILE: backend/server.py

DESCRIPTION:
Lightweight local HTTP server bridging the web frontend to the compiled
C++ backend executable (solver.exe).

FEATURES:
- Uses ONLY Python standard library (no pip dependencies required)
- Serves static frontend files (HTML, CSS, JS) at http://localhost:8000
- Exposes POST /api/solve to safely invoke compiled solver.exe with JSON
- Exposes GET /api/health to confirm C++ backend readiness
============================================================================
"""

import http.server
import socketserver
import json
import subprocess
import os
import sys

PORT = 8000
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")
SOLVER_EXE = os.path.join(BACKEND_DIR, "solver.exe")

class MazeMasterHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve static files directly from the frontend directory
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/api/health":
            self.handle_health()
        elif self.path == "/api/original-code":
            self.handle_original_code()
        elif self.path == "/api/backend-code":
            self.handle_backend_code()
        else:
            # Fallback to serving frontend static assets
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/solve":
            self.handle_solve()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_health(self):
        exe_exists = os.path.exists(SOLVER_EXE)
        response_data = {
            "status": "online",
            "backend": "C++ Native Executable",
            "solverPath": SOLVER_EXE,
            "executableFound": exe_exists,
            "message": "C++ Backend Ready" if exe_exists else "solver.exe not found! Run compile.bat."
        }
        self.send_json_response(200 if exe_exists else 500, response_data)

    def handle_original_code(self):
        orig_file = os.path.join(BACKEND_DIR, "original_code.cpp")
        if os.path.exists(orig_file):
            with open(orig_file, "r", encoding="utf-8") as f:
                code = f.read()
            self.send_json_response(200, {"code": code})
        else:
            self.send_error(404, "original_code.cpp not found")

    def handle_backend_code(self):
        backend_file = os.path.join(BACKEND_DIR, "solver.cpp")
        if os.path.exists(backend_file):
            with open(backend_file, "r", encoding="utf-8") as f:
                code = f.read()
            self.send_json_response(200, {"code": code})
        else:
            self.send_error(404, "solver.cpp not found")

    def handle_solve(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            req_json = json.loads(post_data.decode("utf-8"))
        except Exception as e:
            self.send_json_response(400, {
                "success": False,
                "status": "INVALID_JSON",
                "message": f"Malformed JSON request: {str(e)}"
            })
            return

        if not os.path.exists(SOLVER_EXE):
            self.send_json_response(500, {
                "success": False,
                "status": "EXECUTABLE_NOT_FOUND",
                "message": "solver.exe is missing. Please compile solver.cpp using compile.bat or g++."
            })
            return

        # Execute the compiled C++ solver process safely via stdin/stdout
        try:
            process = subprocess.Popen(
                [SOLVER_EXE],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=json.dumps(req_json), timeout=5)

            if process.returncode != 0 and not stdout:
                self.send_json_response(500, {
                    "success": False,
                    "status": "PROCESS_ERROR",
                    "message": f"C++ solver crashed (Exit Code: {process.returncode}): {stderr}"
                })
                return

            result = json.loads(stdout)
            self.send_json_response(200, result)

        except subprocess.TimeoutExpired:
            process.kill()
            self.send_json_response(504, {
                "success": False,
                "status": "TIMEOUT",
                "message": "C++ solver execution timed out."
            })
        except Exception as e:
            self.send_json_response(500, {
                "success": False,
                "status": "EXECUTION_ERROR",
                "message": f"Server failed to execute C++ solver: {str(e)}"
            })

    def send_json_response(self, status_code, data):
        json_bytes = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(json_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(json_bytes)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

def main():
    # Allow port reuse to avoid 'Address already in use' error
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MazeMasterHandler) as httpd:
        print("=" * 65)
        print("  MAZEMASTER LOCAL SERVER (C++ BACKEND BRIDGE)")
        print("=" * 65)
        print(f"  Server URL:       http://localhost:{PORT}")
        print(f"  Frontend Folder:  {FRONTEND_DIR}")
        print(f"  C++ Solver:       {SOLVER_EXE}")
        print(f"  Status:           Ready & Listening on port {PORT}")
        print("  Press Ctrl+C to stop the server.")
        print("=" * 65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == "__main__":
    main()
