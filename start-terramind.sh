#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR" || exit 1
export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin:$PATH"

echo "==========================================================="
echo "   TerraMind - AI Cloud & Infrastructure Architect        "
echo "==========================================================="
echo " Starting server on http://localhost:3080..."

if ! curl -s http://127.0.0.1:11434/api/version &>/dev/null && ! curl -s http://localhost:11434/api/version &>/dev/null; then
    echo " Starting local Ollama server..."
    if [ -d /run/systemd/system ] && command -v systemctl &>/dev/null; then
        sudo systemctl start ollama 2>/dev/null || systemctl start ollama 2>/dev/null || true
    fi
    for s in {1..4}; do
        if curl -s http://127.0.0.1:11434/api/version &>/dev/null || curl -s http://localhost:11434/api/version &>/dev/null; then
            break
        fi
        sleep 0.5
    done
    if ! curl -s http://127.0.0.1:11434/api/version &>/dev/null && ! curl -s http://localhost:11434/api/version &>/dev/null; then
        ollamaBin=$(command -v ollama || [ -x "/usr/local/bin/ollama" ] && echo "/usr/local/bin/ollama" || echo "")
        if [ -n "$ollamaBin" ]; then
            nohup "$ollamaBin" serve >/dev/null 2>&1 &
            sleep 1.5
        fi
    fi
fi

if [ ! -f "$DIR/apps/web/dist/index.html" ]; then
    echo " Building web frontend assets..."
    (cd "$DIR" && npm run build) >/dev/null 2>&1 || true
fi

if [ -f "$DIR/apps/server/dist/server.js" ]; then
    node "$DIR/apps/server/dist/server.js"
else
    npm start
fi
