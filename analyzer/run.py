"""
Entry point for the SETFLOW Local Library Analyzer sidecar service.

Usage:
    python run.py

Starts uvicorn bound to 127.0.0.1:8322 (localhost only — this service is
not meant to be reachable from the network).
"""

import uvicorn

HOST = "127.0.0.1"
PORT = 8322

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False, log_level="info")
