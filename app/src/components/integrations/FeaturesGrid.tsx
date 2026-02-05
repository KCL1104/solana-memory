'use client';

import { 
  Puzzle, 
  Wrench, 
  ShieldCheck, 
  Zap,
  Terminal,
  Workflow,
  Database,
  Lock
} from 'lucide-react';

const features = [
  {
    icon: Puzzle,
    title: "8 Actions",
    description: "Store, retrieve, search, update, delete, archive, versions, and list memories"
  },
  {
    icon: Wrench,
    title: "5 LangChain Tools",
    description: "Compatible with LangChain agents for seamless integration"
  },
  {
    icon: ShieldCheck,
    title: "Type Safe",
    description: "Full TypeScript support with Zod validation schemas"
  },
  {
    icon: Zap,
    title: "Production Ready",
    description: "Comprehensive test suite with 100% coverage"
  },
  {
    icon: Terminal,
    title: "Easy CLI",
    description: "Command-line interface for quick memory operations"
  },
  {
    icon: Workflow,
    title: "Agent Native",
    description: "Built specifically for Solana Agent Kit workflows"
  },
  {
    icon: Database,
    title: "On-Chain Storage",
    description: "Decentralized persistent storage on Solana blockchain"
  },
  {
    icon: Lock,
    title: "Encrypted",
    description: "Client-side encryption keeps your data secure"
  }
];

export function FeaturesGrid() {
  return (
    <section className="py-20 px-4 bg-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Plugin Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition">
              <feature.icon className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
