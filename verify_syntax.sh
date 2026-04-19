#!/bin/bash
# Simple syntax check for game.js
node -c game.js
if [ $? -eq 0 ]; then
    echo "✅ Syntax OK"
    exit 0
else
    echo "❌ Syntax Error found in game.js"
    exit 1
fi