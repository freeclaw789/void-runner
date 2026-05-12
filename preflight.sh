#!/data/data/com.termux/files/usr/bin/bash
# void-runner/preflight.sh
# Mandatory pre-flight validation before pushing changes

echo "🚀 Starting Pre-Flight Validation..."

# 1. Syntax Check
echo "Checking syntax..."
/data/data/com.termux/files/usr/bin/bash void-runner/verify_syntax.sh
if [ $? -ne 0 ]; then
    echo "❌ Syntax check failed!"
    exit 1
fi

# 2. Headless Stability Test
echo "Running headless stability tests..."
/data/data/com.termux/files/usr/bin/node void-runner/headless_test.cjs
if [ $? -ne 0 ]; then
    echo "❌ Headless stability test failed!"
    exit 1
fi

# 3. CI Checks
echo "Running CI checks..."
/data/data/com.termux/files/usr/bin/bash void-runner/ci_check.sh
if [ $? -ne 0 ]; then
    echo "❌ CI checks failed!"
    exit 1
fi

echo "✅ Pre-Flight Validation PASSED! Ready to push."
exit 0
