import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { AnatomySection } from '@/components/learn/AnatomySection';
import { GasLabSection } from '@/components/learn/GasLabSection';
import type { PresetRequest } from '@/components/learn/GasLabSection';
import { GlossarySection } from '@/components/learn/GlossarySection';
import { PipelineSection } from '@/components/learn/PipelineSection';
import { SeveritySection } from '@/components/learn/SeveritySection';

const TABS = [
  { id: 'gas-lab', label: 'Gas Lab' },
  { id: 'anatomy', label: 'Inside the Transformer' },
  { id: 'pipeline', label: 'The Pipeline' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'severity', label: 'Severity Ladder' },
];

/**
 * Interactive knowledge base for DTL staff. All sections are kept mounted
 * (hidden, not unmounted) so the Gas Lab keeps its slider state while the
 * reader explores other tabs.
 */
export function LearnPage() {
  const [activeTab, setActiveTab] = useState('gas-lab');
  const [presetRequest, setPresetRequest] = useState<PresetRequest | null>(null);

  const jumpToGasLabWithPreset = (presetId: string) => {
    setPresetRequest({ presetId, token: Date.now() });
    setActiveTab('gas-lab');
  };

  return (
    <div>
      <PageHeader
        title="Learn DGA"
        description="What the gases mean, how the diagnostic methods work, and why the system says what it says — hands-on, not another PDF."
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="pt-6">
        <div hidden={activeTab !== 'gas-lab'}>
          <GasLabSection presetRequest={presetRequest} />
        </div>
        <div hidden={activeTab !== 'anatomy'}>
          <AnatomySection onTryPreset={jumpToGasLabWithPreset} />
        </div>
        <div hidden={activeTab !== 'pipeline'}>
          <PipelineSection onOpenGasLab={() => setActiveTab('gas-lab')} />
        </div>
        <div hidden={activeTab !== 'glossary'}>
          <GlossarySection />
        </div>
        <div hidden={activeTab !== 'severity'}>
          <SeveritySection />
        </div>
      </div>
    </div>
  );
}
