'use client';

import { useEffect, useState } from 'react';

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  estimatedValue: number;
  contact: { firstName: string; lastName: string };
}

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities');
        if (response.ok) {
          const data = await response.json();
          setOpportunities(data.opportunities);
          setPipelineValue(data.pipelineValue);
        }
      } catch (error) {
        console.error('Failed to fetch opportunities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const stages = ['NEW_LEAD', 'CONTACTED', 'MEETING', 'PROPOSAL', 'WON', 'LOST'];
  const stageLabels = {
    NEW_LEAD: 'New Lead',
    CONTACTED: 'Contacted',
    MEETING: 'Meeting',
    PROPOSAL: 'Proposal',
    WON: 'Won',
    LOST: 'Lost',
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading pipeline...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600 mt-2">Pipeline Value: ${pipelineValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageOpps = opportunities.filter((opp) => opp.stage === stage);
          const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);

          return (
            <div key={stage} className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-2">
                {(stageLabels as any)[stage]}
              </h2>
              <p className="text-sm text-gray-600 mb-4">${stageValue.toLocaleString()}</p>
              <div className="space-y-2">
                {stageOpps.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Empty</p>
                ) : (
                  stageOpps.map((opp) => (
                    <div key={opp.id} className="bg-white p-3 rounded border border-gray-200 text-sm">
                      <p className="font-medium text-gray-900">{opp.name}</p>
                      <p className="text-xs text-gray-600">${opp.estimatedValue?.toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
