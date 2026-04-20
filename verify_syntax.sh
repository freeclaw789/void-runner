#!/data/data/com.termux/files/usr/bin/bash
# Simple syntax check for game.js
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
/data/data/com.termux/files/usr/bin/node -c "$DIR/game.js"
if [ $? -eq 0 ]; then
    echo "✅ Syntax OK"
    exit 0
else
    echo "❌ Syntax Error found in $DIR/game.js"
    exit 1
fi
