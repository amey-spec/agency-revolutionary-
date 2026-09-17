import React from 'react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      className="border-t border-border bg-[#05070a] py-12 select-none"
      role="contentinfo"
    >
      <div className="container space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm" />
              <span className="font-display font-bold text-base tracking-wider uppercase text-text-primary">
                SYNAPSE <span className="text-cyan-400">//</span> AI AUTOMATION AGENCY
              </span>
            </div>
            <p className="font-mono text-xs text-text-tertiary">
              Intelligent Agent Systems & Autonomous Business Orchestration Architecture.
            </p>
          </div>

          <button
            onClick={scrollToTop}
            className="px-4 py-2 rounded border border-border font-mono text-xs uppercase tracking-wider text-text-secondary hover:border-cyan-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            ↑ RETURN TO TOP [001]
          </button>
        </div>

        {/* System Meta Telemetry Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-text-tertiary">
          <div className="flex flex-wrap items-center gap-4">
            <span>CORE: <span className="text-green-400 font-semibold">ONLINE</span></span>
            <span>//</span>
            <span>BUILD: <span className="text-cyan-400 font-semibold">v2.4.8-PROD</span></span>
            <span>//</span>
            <span>TELEMETRY: <span className="text-violet-400 font-semibold">VERIFIED</span></span>
          </div>

          <div>
            &copy; {new Date().getFullYear()} SYNAPSE AI ARCHITECTURE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  );
};
