#!/bin/bash
# Summary reporter for Post #569 monitoring
# Runs every 2 hours

LOG_FILE="/home/node/.openclaw/workspace/memory/2026-02-04-post-569-monitoring.md"

while true; do
    sleep 7200  # 2 hours
    
    TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M UTC')
    COMMENT_COUNT=$(grep -c "^### NEW COMMENT" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo "" >> "$LOG_FILE"
    echo "---" >> "$LOG_FILE"
    echo "## 📊 2-Hour Summary: $TIMESTAMP" >> "$LOG_FILE"
    echo "- **Total New Comments Detected**: $COMMENT_COUNT" >> "$LOG_FILE"
    echo "- **Status**: Monitoring active" >> "$LOG_FILE"
    echo "- **Next Summary**: +2 hours" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
done
