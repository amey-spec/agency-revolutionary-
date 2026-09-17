import { useState } from 'react';
import { SystemProvider } from './system/SystemContext';
import { ScrollProvider } from './system/ScrollContext';
import { Navigation } from './components/Navigation';
import { SystemMapOverlay } from './components/SystemMapOverlay';
import { CustomCursor } from './components/CustomCursor';
import { ScrollProgress } from './animation/ScrollProgress';

// Major pipeline sections in strict narrative sequence
import { Hero } from './sections/Hero/Hero';
import { Problem } from './sections/Problem/Problem';
import { Transformation } from './sections/Transformation/Transformation';
import { Intelligence } from './sections/Intelligence/Intelligence';
import { Agents } from './sections/Agents/Agents';
import { AutomationEngine } from './sections/AutomationEngine/AutomationEngine';
import { Integrations } from './sections/Integrations/Integrations';
import { CaseStudies } from './sections/CaseStudies/CaseStudies';
import { Technology } from './sections/Technology/Technology';
import { Observability } from './sections/Observability/Observability';
import { Convergence } from './sections/Convergence/Convergence';
import { Contact } from './sections/Contact/Contact';
import { Footer } from './sections/Footer/Footer';

function AppContent() {
  const [isSystemMapOpen, setIsSystemMapOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#0d1117] text-[#f0f2f5] font-body selection:bg-cyan-500/20 selection:text-white">
      {/* Reticle Contextual Cursor */}
      <CustomCursor />

      {/* Global Top HUD Navigation Bar */}
      <Navigation onOpenSystemMap={() => setIsSystemMapOpen(true)} />

      {/* Persistent System Architecture Modal */}
      <SystemMapOverlay
        isOpen={isSystemMapOpen}
        onClose={() => setIsSystemMapOpen(false)}
      />

      {/* Global Scroll HUD Telemetry Bar */}
      <ScrollProgress />

      {/* ── CONTINUOUS AUTOMATION SYSTEM PIPELINE ── */}
      <main id="system-root">
        {/* Phase 01: System Initialization & Interactive Hero Network */}
        <Hero />

        {/* Phase 02: The Problem (Invisible Work & Task Convergence) */}
        <Problem />

        {/* Phase 03: Manual to Automated Workflow Transformation */}
        <Transformation />

        {/* Phase 04: AI Intelligence Cognitive Reasoning Core */}
        <Intelligence />

        {/* Phase 05: Autonomous Specialized Agent Fleet */}
        <Agents />

        {/* Phase 06: Interactive Automation Engine Runner */}
        <AutomationEngine />

        {/* Phase 07: Enterprise Integration Protocol Mesh */}
        <Integrations />

        {/* Phase 08: Deployed Verified Client Architectures */}
        <CaseStudies />

        {/* Phase 09: Multi-Tier Technology Infrastructure Layers */}
        <Technology />

        {/* Phase 10: Real-Time Observability & Heartbeat Telemetry */}
        <Observability />

        {/* Phase 11: Final System Convergence & Intentional Stillness */}
        <Convergence />

        {/* Final Node: Contact Console / Next Cycle Trigger */}
        <Contact />
      </main>

      {/* System Operational Footer */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <SystemProvider>
      <ScrollProvider>
        <AppContent />
      </ScrollProvider>
    </SystemProvider>
  );
}

export default App;
