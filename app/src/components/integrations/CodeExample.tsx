'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const installSteps = [
  {
    label: "# Install plugin",
    code: "npm install @agentmemory/solana-agent-kit-plugin",
    color: "text-cyan-400"
  },
  {
    label: "# Import and use",
    code: "import { AgentMemoryPlugin } from '@agentmemory/solana-agent-kit-plugin';",
    color: "text-green-400"
  }
];

const codeExample = `import { SolanaAgentKit } from 'solana-agent-kit';
import { AgentMemoryPlugin } from '@agentmemory/solana-agent-kit-plugin';

// Initialize Solana Agent Kit
const agent = new SolanaAgentKit(
  process.env.PRIVATE_KEY!,
  process.env.RPC_URL!,
  process.env.OPENAI_API_KEY!
);

// Register the memory plugin
const memoryPlugin = new AgentMemoryPlugin();
agent.use(memoryPlugin);

// Store a memory
const result = await agent.execute(
  ActionName.STORE_MEMORY,
  {
    content: "User prefers dark mode interface",
    importance: "high",
    tags: ["preference", "ui"]
  }
);

console.log('Memory stored:', result.memoryId);`;

export function CodeExample() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-8">
          Get Started in 5 Minutes
        </h2>
        
        {/* Installation Steps */}
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-700 text-left mb-8">
          <code className="text-sm block space-y-2">
            {installSteps.map((step, i) => (
              <div key={i}>
                <span className="text-slate-500">{step.label}</span>
                <br />
                <span className={step.color}>{step.code}</span>
              </div>
            ))}
          </code>
        </div>

        {/* Full Code Example */}
        <div className="bg-slate-950 rounded-xl p-6 border border-slate-700 text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">Quick Start Example</span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="text-sm text-slate-300 overflow-x-auto">
            <code>{codeExample}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
