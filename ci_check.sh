#!/bin/sh
# CI-like check for Void Runner
echo "Running CI checks..."

# Syntax check for game.js
if /data/data/com.termux/files/usr/bin/node -c void-runner/game.js; then
    echo "✅ game.js syntax OK"
else
    echo "❌ game.js syntax error"
    exit 1
fi

# Syntax check for tests.js
if /data/data/com.termux/files/usr/bin/node -c void-runner/tests.js; then
    echo "✅ tests.js syntax OK"
else
    echo "❌ tests.js syntax error"
    exit 1
fi

echo "🚀 All CI checks passed!"
exit 0