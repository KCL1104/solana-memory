'use client';

import { ArrowRight, Github, BookOpen } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Add Memory to Your Agent?
        </h2>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Join developers building persistent AI agents on Solana. 
          Get started with the official AgentMemory plugin today.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="https://github.com/KCL1104/solana-memory/tree/main/integrations/solana-agent-kit-plugin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition"
          >
            <Github className="w-5 h-5" />
            Get Started
            <ArrowRight className="w-4 h-4" />
          </a>
          <a 
            href="#"
            className="inline-flex items-center gap-2 px-8 py-4 border border-slate-600 text-slate-300 rounded-lg font-semibold hover:border-cyan-500 hover:text-cyan-400 transition"
          >
            <BookOpen className="w-5 h-5" />
            View Documentation
          </a>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-slate-500 text-sm">
            Built with ❤️ for the Solana Agent Kit community
          </p>
        </div>
      </div>
    </section>
  );
}
