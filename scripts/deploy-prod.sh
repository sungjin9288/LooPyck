#!/bin/bash

# Safe Deployment Script for LooPyck
# Ensures code quality before allowing deployment.

echo "🚀 Starting Production Deployment Sequence..."

# 1. Type Check
echo "🔍 Running Type Check..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Type Check Failed! Aborting deployment."
    exit 1
fi

# 2. Test (Optional - uncomment if tests exist)
# echo "🧪 Running Tests..."
# npm test
# if [ $? -ne 0 ]; then
#     echo "❌ Tests Failed! Aborting deployment."
#     exit 1
# fi

# 3. Git Tagging
VERSION=$(date +%Y%m%d%H%M)
echo "🏷️ Tagging release: v$VERSION"
git tag -a "v$VERSION" -m "Production Release $VERSION"

echo "✅ Ready for Push & Deploy!"
echo "Run: git push origin v$VERSION"
