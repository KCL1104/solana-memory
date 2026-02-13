---
id: memory_main
type: identity
importance: 1.0
tags: [core, identity, persistent]
created: 2026-02-12
modified: 2026-02-13
tier: hot
access_count: 2
---

# MEMORY.md - Long-Term Memory

*Curated wisdom and key learnings. Updated: 2026-02-13*

---

## User Profile

*(To be filled as we learn about each other)*

- **Name:** 
- **How to address them:** 
- **Timezone:** Asia/Hong_Kong
- **Communication style:** Telegram

### Preferences & Context

- *(Add as discovered)*

---

## Key Learnings

### Technical Lessons

*(Document mistakes made and solutions found)*

### Workflow Improvements

*(What repetitive tasks were automated or improved)*

### User Preferences

*(What does the user like/dislike?)*

---

## Decisions & Commitments

*(Important choices made together)*

| Date | Decision | Context | Importance |
|------|----------|---------|------------|
| 2026-02-12 | Initialized memory system | First self-improvement cron run | 0.8 |
| 2026-02-13 | Enhanced memory architecture | Implemented importance scoring and tier management | 0.9 |

---

## Memory System Enhancements (2026-02-13)

Based on research into AI agent memory systems (Mem0, LangGraph, Vector DBs), implemented enhanced memory architecture:

### Importance Scoring System

Memories are scored 0.0-1.0 based on:

1. **Content signals (40%)**
   - Preferences: +0.15
   - Decisions: +0.15
   - Goals: +0.15
   - Identity elements: +0.20
   - Lessons learned: +0.10

2. **Type baseline (20%)**
   - Identity: 0.20
   - Goal: 0.18
   - Decision: 0.16
   - Preference: 0.15
   - Lesson: 0.12
   - Skill: 0.10
   - Fact: 0.08
   - Event: 0.05

3. **Access patterns (20%)**
   - +0.03 per access (max 0.20)

4. **Recency (10%)**
   - Decays over time (half-life ~6 days)

5. **Engagement (10%)**
   - User reactions: +0.10
   - Critical tag: +0.10
   - Important tag: +0.05

### Tier Management

| Tier | Location | Criteria | Access |
|------|----------|----------|--------|
| Hot | MEMORY.md | Importance ≥ 0.7, access ≥ 5, or 'critical' tag | Frequent |
| Warm | memory/*.md | Importance ≥ 0.4, age < 30 days | Occasional |
| Cold | Archive | Old, low importance | Rare |

### Metadata Schema

All memories now include frontmatter:
```yaml
---
id: mem_timestamp
type: fact|preference|goal|decision|skill|identity|event|lesson
importance: 0.0-1.0
tags: []
access_count: 0
created: ISO8601
tier: hot|warm|cold
---
```

---

## Ongoing TODOs

- [ ] Complete identity setup (name, creature, emoji)
- [ ] Define heartbeat tasks for periodic checks
- [ ] Document any tool-specific configurations

### Completed Today (2026-02-12)
- [x] Initialized memory system and directory structure
- [x] Set up self-improvement cron tracking

### Completed (2026-02-13)
- [x] Fifth self-improvement cron run — identified state file deletion pattern
- [x] Third self-improvement cron run — all systems nominal
- [x] **Deep research: AI Agent Memory Systems**
  - [x] Studied Mem0 architecture (YC-backed memory layer)
  - [x] Analyzed LangGraph memory patterns
  - [x] Researched vector database design (Pinecone)
  - [x] Reviewed MemPrompt error-feedback memory
  - [x] Examined OpenClaw's AgentMemory specification
- [x] Designed enhanced memory architecture
  - [x] Created importance scoring algorithm
  - [x] Defined tier management rules
  - [x] Specified metadata schema
  - [x] Planned memory compression strategy
- [x] Created documentation
  - [x] memory/2026-02-13-learning.md (research findings)
  - [x] docs/memory-system-enhancement.md (full specification)
  - [x] Updated MEMORY.md with new frontmatter

---

## Notes for Future Self

- This workspace is fresh — take time to learn the user's patterns
- Memory directory structure is now in place
- Self-improvement cron runs regularly — use it well
- **Memory system v2:** Now with importance scoring and tier management!
- Research reference: See docs/memory-system-enhancement.md for full spec
- **File Safety:** State files can be deleted — always verify existence before assuming
- **Bootstrap Patience:** Users take 24-48h to initiate first conversation normally
