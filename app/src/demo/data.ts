/**
 * Demo Data for AgentMemory
 * Realistic demo memories for showcasing the product value
 */

export interface DemoMemory {
  key: string;
  content: any;
  category: string;
  tags: string[];
  importance: number;
  description?: string;
}

/**
 * 8 realistic demo memories covering common use cases
 */
export const demoMemories: DemoMemory[] = [
  {
    key: "user_preferences",
    content: {
      theme: "dark",
      language: "zh-TW",
      notifications: true,
      font: "monospace",
      accent_color: "orange",
      sidebar_collapsed: false,
      auto_save: true
    },
    category: "preference",
    tags: ["ui", "settings", "personalization"],
    importance: 90,
    description: "User interface preferences and personalization settings"
  },
  {
    key: "morning_routine",
    content: {
      drink: "iced_latte",
      time: "08:30",
      location: "home",
      duration_minutes: 30,
      activities: ["coffee", "news_check", "email_review"],
      preferred_barista: "Starbucks - Main St"
    },
    category: "routine",
    tags: ["daily", "habit", "lifestyle"],
    importance: 85,
    description: "Daily morning routine and preferences"
  },
  {
    key: "work_project_ai_agent",
    content: {
      name: "AgentMemory Hackathon",
      progress: 85,
      deadline: "2026-02-05T23:59:59Z",
      priority: "high",
      tech_stack: ["Rust", "Anchor", "React", "TypeScript"],
      milestones: [
        { name: "Core SDK", completed: true },
        { name: "Smart Contracts", completed: true },
        { name: "Frontend", completed: true },
        { name: "Demo Video", completed: false }
      ]
    },
    category: "project",
    tags: ["work", "hackathon", "blockchain", "solana"],
    importance: 95,
    description: "Current work project tracking and milestones"
  },
  {
    key: "important_dates",
    content: {
      birthday: "1995-06-15",
      anniversary: "2020-09-20",
      hackathon_deadline: "2026-02-05",
      upcoming_events: [
        { date: "2026-02-05", name: "Colosseum Submission", type: "deadline" },
        { date: "2026-02-14", name: "Valentine's Day", type: "personal" }
      ],
      reminders_enabled: true
    },
    category: "calendar",
    tags: ["personal", "events", "reminders"],
    importance: 88,
    description: "Important personal dates and upcoming events"
  },
  {
    key: "learning_progress",
    content: {
      skill: "Rust Programming",
      level: "intermediate",
      started_date: "2025-11-01",
      total_hours: 120,
      resources: [
        { name: "Rust Book", progress: 80 },
        { name: "Anchor Framework", progress: 60 },
        { name: "Solana Development", progress: 45 }
      ],
      next_goal: "Complete Solana program deployment",
      certification: "Solana Developer - In Progress"
    },
    category: "learning",
    tags: ["education", "programming", "blockchain"],
    importance: 80,
    description: "Learning progress and skill development tracking"
  },
  {
    key: "health_fitness",
    content: {
      daily_step_goal: 10000,
      current_streak: 15,
      preferred_workout: "morning_run",
      sleep_schedule: {
        bedtime: "23:00",
        wake_time: "07:00",
        target_hours: 8
      },
      dietary_preferences: ["low_carb", "high_protein"],
      water_intake_ml: 2500
    },
    category: "health",
    tags: ["fitness", "wellness", "daily"],
    importance: 75,
    description: "Health and fitness tracking preferences"
  },
  {
    key: "coding_snippets",
    content: {
      favorite_vscode_extensions: ["Rust Analyzer", "Tailwind CSS", "GitLens"],
      common_shortcuts: {
        format: "Shift+Alt+F",
        terminal: "Ctrl+`",
        search: "Ctrl+P"
      },
      recent_repos: [
        "agent-memory",
        "solana-pda-explorer",
        "hackathon-demo"
      ],
      preferred_editor_theme: "Cyberpunk Neon"
    },
    category: "knowledge",
    tags: ["development", "tools", "productivity"],
    importance: 70,
    description: "Developer preferences and productivity settings"
  },
  {
    key: "travel_preferences",
    content: {
      home_airport: "HKG",
      airline_tier: "Gold",
      seat_preference: "window",
      meal_preference: "vegetarian",
      favorite_destinations: ["Tokyo", "Singapore", "San Francisco"],
      packing_checklist_template: [
        "Passport",
        "Laptop + Charger",
        "Universal Adapter",
        "Noise-canceling Headphones"
      ]
    },
    category: "travel",
    tags: ["travel", "preferences", "lifestyle"],
    importance: 72,
    description: "Travel preferences and frequent flyer information"
  }
];

/**
 * Get memories by category
 */
export function getMemoriesByCategory(category: string): DemoMemory[] {
  return demoMemories.filter(m => m.category === category);
}

/**
 * Get memories by tag
 */
export function getMemoriesByTag(tag: string): DemoMemory[] {
  return demoMemories.filter(m => m.tags.includes(tag));
}

/**
 * Get high importance memories (importance >= 85)
 */
export function getHighImportanceMemories(): DemoMemory[] {
  return demoMemories.filter(m => m.importance >= 85);
}

/**
 * Convert demo memory to SDK format
 */
export function toSDKFormat(memory: DemoMemory, vaultId: string) {
  return {
    key: memory.key,
    data: memory.content,
    metadata: {
      tags: memory.tags,
      labels: {
        category: memory.category,
        importance: memory.importance.toString(),
        description: memory.description || ""
      },
      contentType: "application/json"
    }
  };
}

/**
 * Get all demo memories in SDK batch format
 */
export function getAllDemoMemoriesForBatch(vaultId: string) {
  return {
    vaultId,
    memories: demoMemories.map(m => toSDKFormat(m, vaultId))
  };
}

/**
 * Get demo memory categories summary
 */
export function getCategorySummary() {
  const categories = demoMemories.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categories).map(([category, count]) => ({
    category,
    count,
    percentage: Math.round((count / demoMemories.length) * 100)
  }));
}

/**
 * Get all unique tags from demo memories
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  demoMemories.forEach(m => m.tags.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
}

/**
 * Get total importance score
 */
export function getTotalImportance(): number {
  return demoMemories.reduce((sum, m) => sum + m.importance, 0);
}

/**
 * Get average importance
 */
export function getAverageImportance(): number {
  return Math.round(getTotalImportance() / demoMemories.length);
}
