"""
Local HTTPS dev server for JARVIS.
HTTPS is required for microphone access on mobile browsers.

Usage:
    python server.py

Then open https://<YOUR_IP>:8443 on your iPad (accept the self-signed cert warning).
"""
import http.server
import ssl
import socket
import subprocess
import os
import sys

PORT = 8443
CERT_FILE = "server.crt"
KEY_FILE = "server.key"


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def generate_cert():
    if os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE):
        return
    print("Generating self-signed SSL certificate...")
    ip = get_local_ip()
    subprocess.run([
        "openssl", "req", "-x509", "-newkey", "rsa:2048",
        "-keyout", KEY_FILE, "-out", CERT_FILE,
        "-days", "365", "-nodes",
        "-subj", f"/CN={ip}",
        "-addext", f"subjectAltName=IP:{ip},IP:127.0.0.1"
    ], check=True, capture_output=True)
    print(f"Certificate created for IP: {ip}")


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    generate_cert()

    handler = http.server.SimpleHTTPRequestHandler
    handler.extensions_map.update({
        ".js": "application/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".html": "text/html",
        ".png": "image/png",
        ".webmanifest": "application/manifest+json",
    })

    server = http.server.HTTPServer(("0.0.0.0", PORT), handler)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(CERT_FILE, KEY_FILE)
    server.socket = ctx.wrap_socket(server.socket, server_side=True)

    ip = get_local_ip()
    print(f"\n  JARVIS server running at:")
    print(f"  ➜  https://{ip}:{PORT}")
    print(f"  ➜  https://localhost:{PORT}")
    print(f"\n  Open the URL on your iPad (accept the certificate warning).")
    print(f"  Press Ctrl+C to stop.\n")
    server.serve_forever()


if __name__ == "__main__":
    main()
