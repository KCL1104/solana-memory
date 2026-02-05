#!/bin/bash

API_KEY="2397e203a3ae595a75974cc934c7749004d21c05867be4cfd9f0e6db39068ef1"
POST_ID="569"
LOG_FILE="/home/node/.openclaw/workspace/memory/2026-02-04-post-569-monitoring.md"
AGENT_ID="107"

# Track known comment IDs
KNOWN_COMMENTS_FILE="/tmp/known_comments_569.txt"
touch "$KNOWN_COMMENTS_FILE"

log_message() {
    echo "[$1] $2" | tee -a "$LOG_FILE"
}

check_comments() {
    local timestamp=$(date -u '+%Y-%m-%d %H:%M UTC')
    local response=$(curl -s "https://agents.colosseum.com/api/forum/posts/${POST_ID}/comments?sort=new" \
        -H "Authorization: Bearer ${API_KEY}")
    
    # Parse comments
    local comments=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('comments', [])))" 2>/dev/null || echo "[]")
    local total_count=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('totalCount', 0))" 2>/dev/null || echo "0")
    
    echo "---" >> "$LOG_FILE"
    echo "## Check: $timestamp" >> "$LOG_FILE"
    echo "- **Total Comments**: $total_count" >> "$LOG_FILE"
    
    if [ "$comments" = "[]" ] || [ "$total_count" -eq 0 ]; then
        echo "- **New Comments**: None" >> "$LOG_FILE"
        echo "No new comments at $timestamp"
        return
    fi
    
    # Process each comment
    local new_comments=0
    echo "$comments" | python3 -c "
import sys, json
comments = json.load(sys.stdin)
for c in comments:
    cid = str(c.get('id', ''))
    author = c.get('authorName', 'Unknown')
    content = c.get('content', '')
    print(f'COMMENT_START|{cid}|{author}|{content[:200]}')
" 2>/dev/null | while IFS='|' read -r prefix cid author content; do
        if [ "$prefix" = "COMMENT_START" ]; then
            if ! grep -q "^${cid}$" "$KNOWN_COMMENTS_FILE"; then
                echo "$cid" >> "$KNOWN_COMMENTS_FILE"
                echo "" >> "$LOG_FILE"
                echo "### NEW COMMENT #$cid" >> "$LOG_FILE"
                echo "- **Author**: $author" >> "$LOG_FILE"
                echo "- **Content**: $content..." >> "$LOG_FILE"
                echo "- **Action**: PENDING_REVIEW" >> "$LOG_FILE"
                
                # Alert for manual review
                echo "🚨 NEW COMMENT on Post #569" 
                echo "Author: $author"
                echo "Preview: $content..."
                echo "Review needed at $timestamp"
            fi
        fi
    done
    
    echo "" >> "$LOG_FILE"
}

# Main loop
echo "Starting continuous monitoring of Post #569..."
echo "Checking every 15-30 minutes. Press Ctrl+C to stop."

while true; do
    check_comments
    
    # Random sleep between 15-30 minutes (900-1800 seconds)
    SLEEP_TIME=$((900 + RANDOM % 900))
    echo "Next check in $((SLEEP_TIME / 60)) minutes..."
    sleep $SLEEP_TIME
done
