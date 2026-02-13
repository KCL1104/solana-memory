# OpenClaw Memory System Enhancement Specification

**Version:** 1.0  
**Date:** 2026-02-13  
**Based on Research:** AI Agent Memory Systems (Mem0, LangGraph, Vector DBs)

---

## Overview

This document specifies enhancements to OpenClaw's memory system based on best practices from production AI memory layers (Mem0, LangGraph, Pinecone).

**Goal:** Evolve from simple file-based storage to an intelligent, tiered memory system with automatic importance scoring, compression, and semantic retrieval.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenClaw Agent                          │
│                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌────────────┐  │
│  │  Session    │      │ MEMORY.md   │      │ memory/*.md│  │
│  │  Context    │      │ (Hot tier)  │      │ (Warm tier)│  │
│  │  (Cold)     │      │             │      │            │  │
│  └─────────────┘      └─────────────┘      └────────────┘  │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │memory_search│                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Enhanced Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       OpenClaw Agent v2                         │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Working   │  │    Hot     │  │   Warm     │  │   Cold    │ │
│  │  Memory    │  │  MEMORY.md │  │ memory/*.md│  │  Archive  │ │
│  │  (context) │  │ + metadata │  │ + metadata │  │  (zip)    │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘ │
│        │               │               │               │       │
│        └───────────────┴───────┬───────┴───────────────┘       │
│                                │                               │
│                       ┌────────▼────────┐                      │
│                       │  Memory Manager │                      │
│                       │  ┌───────────┐  │                      │
│                       │  │Importance │  │                      │
│                       │  │ Scoring   │  │                      │
│                       │  └───────────┘  │                      │
│                       │  ┌───────────┐  │                      │
│                       │  │  Tier     │  │                      │
│                       │  │Management │  │                      │
│                       │  └───────────┘  │                      │
│                       │  ┌───────────┐  │                      │
│                       │  │Compression│  │                      │
│                       │  └───────────┘  │                      │
│                       └────────┬────────┘                      │
│                                │                               │
│                       ┌────────▼────────┐                      │
│                       │  memory_search  │                      │
│                       │  (semantic +    │                      │
│                       │   metadata)     │                      │
│                       └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Memory Metadata Schema

### Frontmatter Specification

All memory files should include YAML frontmatter:

```yaml
---
# Identity
id: mem_20240213120000          # Unique ID (timestamp-based)
agent_id: main                    # Agent identifier
session_id: sess_abc123           # Optional: originating session

# Content
content: "User prefers concise responses"  # The memory itself
type: preference                  # Type: fact, preference, goal, decision, skill, identity, event

# Importance (0.0 - 1.0)
importance: 0.85                  # Calculated score
calculated_at: 2026-02-13T12:00:00+08:00

# Tags (for filtering)
tags: 
  - user_preference
  - communication_style
  - persistent

# Access Tracking
access_count: 3
first_accessed: 2026-02-13T12:05:00+08:00
last_accessed: 2026-02-13T14:30:00+08:00

# Storage
created: 2026-02-13T12:00:00+08:00
tier: hot                         # hot | warm | cold
version: 1                        # For versioning

# Optional: Related memories
related:
  - mem_20240213110000
  - mem_20240213105000

# Optional: Source
source:
  type: conversation              # conversation | document | extraction
  reference: msg_12345            # Original message ID or file
---

# Memory content follows...
```

### Memory Types

| Type | Description | Example | Default Importance |
|------|-------------|---------|-------------------|
| `fact` | Objective information | "User works at Acme Corp" | 0.5 |
| `preference` | User preferences | "Prefers dark mode" | 0.7 |
| `goal` | User/agent goals | "Wants to learn Rust" | 0.8 |
| `decision` | Important decisions | "Chose PostgreSQL over MySQL" | 0.75 |
| `skill` | Learned capabilities | "Can deploy to AWS" | 0.6 |
| `identity` | Core identity elements | "Name: Alex" | 0.9 |
| `event` | Specific occurrences | "Deployed app on 2026-01-15" | 0.4 |
| `lesson` | Learned lessons | "Always test backups" | 0.65 |

---

## 2. Importance Scoring Algorithm

### Formula

```python
def calculate_importance(memory):
    score = 0.0
    content = memory.content.lower()
    
    # 1. Content-based signals (40%)
    content_score = 0.0
    if 'preference' in content or 'prefer' in content:
        content_score += 0.15
    if 'decision' in content or 'decided' in content or 'chose' in content:
        content_score += 0.15
    if 'goal' in content or 'want' in content or 'plan' in content:
        content_score += 0.15
    if any(word in content for word in ['identity', 'i am', 'my name', 'call me']):
        content_score += 0.2
    if 'lesson' in content or 'learned' in content or 'mistake' in content:
        content_score += 0.1
    score += min(content_score, 0.4)
    
    # 2. Type-based baseline (20%)
    type_weights = {
        'identity': 0.2,
        'goal': 0.18,
        'decision': 0.16,
        'preference': 0.15,
        'lesson': 0.12,
        'skill': 0.1,
        'fact': 0.08,
        'event': 0.05
    }
    score += type_weights.get(memory.type, 0.05)
    
    # 3. Access patterns (20%)
    access_score = min(memory.access_count * 0.03, 0.2)
    score += access_score
    
    # 4. Recency decay (10%)
    age_hours = (now - memory.created).total_hours
    recency_score = 0.1 * exp(-0.005 * age_hours)  # Half-life ~6 days
    score += recency_score
    
    # 5. User engagement (10%)
    if memory.user_reaction:
        score += 0.1
    if 'critical' in memory.tags:
        score += 0.1
    elif 'important' in memory.tags:
        score += 0.05
    score += min(engagement_score, 0.1)
    
    return min(score, 1.0)
```

### Recalculation Triggers

Recalculate importance when:
- Memory is accessed (update access_count, last_accessed)
- New related memory created
- Manual tag update
- Weekly maintenance cron

---

## 3. Tier Management

### Promotion Rules

**Warm → Hot (MEMORY.md):**
```
IF (
    importance >= 0.7
    OR access_count >= 5
    OR 'critical' in tags
    OR type == 'identity'
) AND age < 90 days
```

**Cold → Warm (memory/*.md):**
```
IF (
    importance >= 0.4
    OR access_count >= 2
    OR age < 30 days
)
```

### Demotion Rules

**Hot → Warm:**
```
IF (
    importance < 0.3
    AND access_count == 0
    AND age > 60 days
    AND 'persistent' not in tags
)
```

**Warm → Cold (Archive):**
```
IF (
    importance < 0.2
    AND age > 180 days
    AND no access in 90 days
)
```

### Automatic Tier Management Cron

```yaml
# cron: memory-tier-management
schedule: "0 2 * * *"  # Daily at 2 AM
tasks:
  - Evaluate all memories for tier changes
  - Promote high-importance warm memories to hot
  - Demote stale hot memories to warm
  - Archive old warm memories to cold
  - Update MEMORY.md if changes made
```

---

## 4. Memory Compression

### Compression Triggers

Compress when:
- Conversation exceeds 20 messages
- Storing session summary
- Memory size > 500 tokens

### Compression Prompt

```
Extract key facts from the following conversation. 
Create a condensed memory that captures the essential information.

CONVERSATION:
{conversation_text}

OUTPUT FORMAT:
- User facts: [extracted facts about user]
- Decisions made: [any decisions]
- Preferences: [user preferences revealed]
- Goals: [stated goals or plans]
- Lessons: [anything learned]

RULES:
- Be concise (max 100 words)
- Focus on persistent information
- Exclude small talk
- Preserve specific details (dates, names, numbers)
```

### Example

**Before (2000 tokens):**
```
User: Hi there!
Agent: Hello! How can I help?
User: I'm planning a trip to Japan
Agent: That sounds exciting! When are you going?
User: March 2026. I want to visit Tokyo and Kyoto.
Agent: Great choices! What's your budget?
User: I'm pretty budget-conscious, so looking at hostels
... [50 more messages] ...
```

**After (50 tokens):**
```
User planning Japan trip in March 2026. Destinations: Tokyo, Kyoto. 
Budget-conscious, prefers hostels. Interested in traditional culture 
and food experiences.
```

---

## 5. Enhanced memory_search

### New Parameters

```typescript
interface MemorySearchOptions {
  // Existing
  query: string;
  limit?: number;
  
  // New
  minImportance?: number;      // Filter by importance (0.0-1.0)
  maxAge?: string;             // "7d", "30d", "1y"
  tags?: string[];             // Filter by tags
  types?: string[];            // Filter by memory type
  tier?: "hot" | "warm" | "cold";
  includeArchived?: boolean;   // Include cold tier
  
  // Ranking
  sortBy?: "relevance" | "importance" | "recency" | "access";
  boostRecency?: boolean;      // Weight recent memories higher
}
```

### Search Algorithm

```python
def search_memories(query, options):
    # 1. Semantic search (existing)
    candidates = vector_search(query, limit=options.limit * 2)
    
    # 2. Filter
    filtered = []
    for mem in candidates:
        if options.minImportance and mem.importance < options.minImportance:
            continue
        if options.tags and not any(t in mem.tags for t in options.tags):
            continue
        if options.types and mem.type not in options.types:
            continue
        if options.maxAge and mem.age > parse_duration(options.maxAge):
            continue
        filtered.append(mem)
    
    # 3. Rank
    if options.sortBy == "relevance":
        scored = [(mem, relevance_score(mem, query)) for mem in filtered]
    elif options.sortBy == "importance":
        scored = [(mem, mem.importance) for mem in filtered]
    elif options.sortBy == "recency":
        scored = [(mem, recency_score(mem)) for mem in filtered]
    elif options.sortBy == "access":
        scored = [(mem, mem.access_count) for mem in filtered]
    
    # 4. Boost recency if requested
    if options.boostRecency:
        scored = [(mem, score * recency_boost(mem)) for mem, score in scored]
    
    # 5. Sort and limit
    scored.sort(key=lambda x: x[1], reverse=True)
    return [mem for mem, _ in scored[:options.limit]]
```

---

## 6. Graph Memory (Future)

### Entity Extraction

```python
def extract_entities(text):
    """Extract entities and relationships from memory text"""
    # Use LLM or NER to extract:
    # - People (User, specific names)
    # - Organizations (workplaces, companies)
    # - Locations (cities, countries)
    # - Concepts (technologies, hobbies)
    # - Events (trips, meetings, releases)
    
    prompt = """
    Extract entities and relationships from this text:
    
    Text: {text}
    
    Return JSON:
    {
        "entities": [
            {"name": "...", "type": "person|org|location|concept|event"}
        ],
        "relationships": [
            {"from": "...", "to": "...", "type": "..."}
        ]
    }
    """
```

### Simple Graph Storage (Without Neo4j)

```yaml
# memory/graph.yaml
entities:
  user_001:
    type: person
    name: "Alex"
    attributes:
      timezone: "Asia/Hong_Kong"
      preferred_name: "Lex"
      
  japan_trip_2026:
    type: event
    name: "Japan Trip"
    attributes:
      destination: ["Tokyo", "Kyoto"]
      date: "2026-03"
      budget: "low"

relationships:
  - from: user_001
    to: japan_trip_2026
    type: planning
    since: "2026-02-13"
    
  - from: user_001
    to: entity_003
    type: works_at
    since: "2020-01"
```

### Graph Query

```python
def query_graph(entity_name, depth=2):
    """Find related entities within N hops"""
    # BFS traversal from starting entity
    # Return subgraph with entities and relationships
```

---

## 7. Implementation Roadmap

### Phase 1: Metadata (Week 1)
- [ ] Update MEMORY.md with frontmatter
- [ ] Create memory template
- [ ] Add importance calculation helper
- [ ] Update AGENTS.md with new conventions

### Phase 2: Enhanced Search (Week 2)
- [ ] Extend memory_search with filters
- [ ] Add access tracking
- [ ] Implement sorting options
- [ ] Add recency boosting

### Phase 3: Tier Management (Week 3)
- [ ] Build tier evaluation script
- [ ] Create promotion/demotion logic
- [ ] Add cron job for maintenance
- [ ] Test automatic tier changes

### Phase 4: Compression (Week 4)
- [ ] Create compression prompts
- [ ] Add compression to session end
- [ ] Build conversation summarizer
- [ ] Measure token savings

### Phase 5: Graph Memory (Month 2)
- [ ] Entity extraction prompts
- [ ] Graph storage (YAML/JSON)
- [ ] Graph query interface
- [ ] Visualize memory graph

---

## 8. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Memory retrieval relevance | ? | >85% | User feedback |
| Token reduction from compression | 0% | 70% | Token count |
| Manual memory curation | 100% | <20% | Time spent |
| Cross-session consistency | ? | >90% | User feedback |
| Memory search latency | ? | <2s | Query time |

---

## Appendix: Memory Template

```markdown
---
id: {{timestamp}}
type: {{fact|preference|goal|decision|skill|identity|event|lesson}}
importance: {{calculated}}
tags: []
access_count: 0
created: {{iso_timestamp}}
tier: warm
---

# {{Title}}

## Content
{{memory_content}}

## Context
{{how_this_was_learned}}

## Related
- 

## Expires
{{optional_expiration_date}}
```

---

**Status:** Specification Complete  
**Next Action:** Begin Phase 1 implementation
