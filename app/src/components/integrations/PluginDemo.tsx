'use client';

import { useState } from 'react';
import { 
  Save, 
  Download, 
  Search, 
  RefreshCw, 
  Trash2,
  Archive,
  History,
  List
} from 'lucide-react';

const actions = [
  { id: 'store', name: 'Store Memory', icon: Save },
  { id: 'retrieve', name: 'Retrieve', icon: Download },
  { id: 'search', name: 'Search', icon: Search },
  { id: 'update', name: 'Update', icon: RefreshCw },
  { id: 'delete', name: 'Delete', icon: Trash2 },
  { id: 'archive', name: 'Archive', icon: Archive },
  { id: 'versions', name: 'Versions', icon: History },
  { id: 'list', name: 'List All', icon: List },
];

function getCodeExample(action: string) {
  const examples: Record<string, string> = {
    store: `const result = await agent.execute(
  ActionName.STORE_MEMORY,
  {
    content: "User prefers dark mode",
    importance: "high",
    tags: ["preference"]
  }
);`,
    retrieve: `const memory = await agent.execute(
  ActionName.RETRIEVE_MEMORY,
  { memoryId: "abc123" }
);`,
    search: `const results = await agent.execute(
  ActionName.SEARCH_MEMORIES,
  {
    query: "user preferences",
    limit: 10
  }
);`,
    update: `const updated = await agent.execute(
  ActionName.UPDATE_MEMORY,
  {
    memoryId: "abc123",
    content: "Updated content"
  }
);`,
    delete: `await agent.execute(
  ActionName.DELETE_MEMORY,
  { memoryId: "abc123" }
);`,
    archive: `await agent.execute(
  ActionName.ARCHIVE_MEMORY,
  { memoryId: "abc123" }
);`,
    versions: `const versions = await agent.execute(
  ActionName.GET_MEMORY_VERSIONS,
  { memoryId: "abc123" }
);`,
    list: `const memories = await agent.execute(
  ActionName.LIST_MEMORIES,
  { vaultId: "my-vault" }
);`,
  };
  return examples[action] || '';
}

export function PluginDemo() {
  const [activeAction, setActiveAction] = useState('store');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeExample(activeAction));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="demo" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          See It In Action
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Action Selector */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">8 Actions Available</h3>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setActiveAction(action.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition text-left ${
                    activeAction === action.id
                      ? 'bg-cyan-500/20 border border-cyan-500/50'
                      : 'hover:bg-slate-700 border border-transparent'
                  }`}
                >
                  <action.icon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-white text-sm">{action.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Code Preview */}
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Example Code</span>
              <button 
                onClick={handleCopy}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-sm text-slate-300 overflow-x-auto">
              <code>{getCodeExample(activeAction)}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
