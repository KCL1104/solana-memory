import { SAKHero } from '@/components/integrations/SAKHero';
import { PluginDemo } from '@/components/integrations/PluginDemo';
import { CodeExample } from '@/components/integrations/CodeExample';
import { FeaturesGrid } from '@/components/integrations/FeaturesGrid';
import { CTASection } from '@/components/integrations/CTASection';

export default function SolanaAgentKitPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <SAKHero />
      <PluginDemo />
      <CodeExample />
      <FeaturesGrid />
      <CTASection />
    </div>
  );
}
