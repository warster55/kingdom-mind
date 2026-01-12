#!/bin/bash

# Sanctuary Ledger - Artifact Archiver
# Compresses test-results/ into archives/verification-[timestamp].tar.gz

# 1. Ensure archives directory exists
mkdir -p archives

# 2. Generate Timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
ARCHIVE_NAME="archives/verification-$TIMESTAMP.tar.gz"

# 3. Check if test-results exists
if [ ! -d "test-results" ]; then
  echo "❌ No test-results directory found."
  exit 1
fi

# 4. Compress
echo "🗄️  Archiving visual evidence..."
tar -czf "$ARCHIVE_NAME" test-results/

# 5. Report
echo "✅ Evidence secured: $ARCHIVE_NAME"
echo "📜 The Ledger is updated."
