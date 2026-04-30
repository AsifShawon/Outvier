'use client';

import { InfoIcon, ExternalLink, Database, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MetabaseEmbed() {
  const embedUrl = process.env.NEXT_PUBLIC_METABASE_EMBED_URL;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start">
        <InfoIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-300">
          <strong className="text-blue-200">Analytics powered by Metabase (Open Source).</strong>{' '}
          Access full dashboard at{' '}
          <a href="http://localhost:3001" target="_blank" className="underline inline-flex items-center gap-1 hover:text-blue-100 transition-colors">
            localhost:3001
            <ExternalLink className="h-3 w-3" />
          </a>. Connect to MongoDB using the Metabase MongoDB connector.
        </div>
      </div>
      
      {embedUrl ? (
        <div className="relative w-full h-[700px] rounded-xl overflow-hidden border border-border/50 bg-white shadow-lg">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allowTransparency
          />
        </div>
      ) : (
        <MetabaseSetupGuide />
      )}
    </div>
  );
}

function MetabaseSetupGuide() {
  const steps = [
    { title: 'Start Metabase', description: 'Run: docker compose up metabase -d', icon: Settings },
    { title: 'Initial Setup', description: 'Open http://localhost:3001 and complete the setup wizard', icon: ExternalLink },
    { title: 'Connect Database', description: 'Add MongoDB: host=outvier-mongodb, port=27017, db=outvier', icon: Database },
    { title: 'Create Dashboards', description: 'Build visualizations for Universities, Programs, and User Analytics', icon: BarChart3 },
    { title: 'Enable Embedding', description: 'Enable public sharing and copy embed URL to NEXT_PUBLIC_METABASE_EMBED_URL in frontend/.env.local', icon: InfoIcon },
  ];

  return (
    <div className="grid gap-6">
      <div className="p-8 border-2 border-dashed border-border/50 rounded-2xl bg-muted/20 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold font-display mb-2">Metabase Integration Required</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
          Follow the steps below to initialize your open-source analytics dashboard and embed it directly into this panel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
          {steps.map((step, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                  {i + 1}
                </div>
                <h4 className="text-sm font-bold">{step.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
