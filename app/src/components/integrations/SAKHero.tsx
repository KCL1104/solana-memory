'use client';

import { 
  BadgeCheck, 
  Download, 
  Star, 
  GitBranch 
} from 'lucide-react';

function Stat({ icon: Icon, label, value }: { icon: typeof Download; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

export function SAKHero() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-sm mb-6">
          <BadgeCheck className="w-4 h-4" />
          Official Plugin
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          AgentMemory for
          <span className="block text-cyan-400">Solana Agent Kit</span>
        </h1>
        
        <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-8">
          Add persistent memory to any Solana Agent Kit agent in 5 minutes. 
          Official plugin with 8 actions, 5 LangChain tools, and full TypeScript support.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="#demo"
            className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition"
          >
            Try Demo
          </a>
          <a 
            href="https://github.com/KCL1104/solana-memory/tree/main/integrations/solana-agent-kit-plugin"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 border border-slate-600 text-slate-300 rounded-lg font-semibold hover:border-cyan-500 hover:text-cyan-400 transition"
          >
            View on GitHub
          </a>
        </div>
        
        <div className="mt-12 flex justify-center gap-8">
          <Stat icon={Download} label="Downloads" value="Ready" />
          <Stat icon={Star} label="Rating" value="5.0" />
          <Stat icon={GitBranch} label="Version" value="v1.0.0" />
        </div>
      </div>
    </section>
  );
}
