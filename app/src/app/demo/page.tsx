import { DemoHero } from '@/components/demo/DemoHero';
import { InteractiveDemo } from '@/components/demo/InteractiveDemo';
import { UseCaseShowcase } from '@/components/demo/UseCaseShowcase';
import { FlowVisualization } from '@/components/demo/FlowVisualization';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-theme-bg-primary text-theme-text-primary font-body hex-bg">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-neon-orange/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-neon-pink/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Grid Lines */}
        <div className="absolute inset-0 cyber-grid opacity-30" />
        
        {/* Scanlines */}
        <div className="absolute inset-0 scanlines pointer-events-none" />
      </div>

      {/* Demo Sections */}
      <DemoHero />
      <FlowVisualization />
      <InteractiveDemo />
      <UseCaseShowcase />

      {/* Footer CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-theme-bg-secondary to-theme-bg-primary" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Build?
          </h2>
          <p className="text-lg text-theme-text-secondary mb-8 max-w-2xl mx-auto">
            Start building persistent AI agents with AgentMemory today. 
            Deploy to devnet in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/"
              className="cyber-btn inline-flex items-center justify-center gap-2"
            >
              Launch App
              <span className="text-lg">→</span>
            </a>
            <a 
              href="https://docs.agentmemory.io"
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-btn-cyan inline-flex items-center justify-center gap-2"
            >
              Read Documentation
            </a>
          </div>
          
          {/* Social Links */}
          <div className="mt-12 flex items-center justify-center gap-6">
            {['GitHub', 'Discord', 'Twitter'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-sm text-theme-text-muted hover:text-neon-cyan transition-colors font-mono uppercase tracking-wider"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
