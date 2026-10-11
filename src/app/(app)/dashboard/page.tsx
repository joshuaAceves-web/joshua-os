'use client';

import { useEffect, useState } from 'react';

interface DashboardMetrics {
  newLeads: number;
  activeLeads: number;
  meetings: number;
  proposals: number;
  wonClients: number;
  activeProjects: number;
  overdueTasks: number;
  pipelineValue: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    newLeads: 0,
    activeLeads: 0,
    meetings: 0,
    proposals: 0,
    wonClients: 0,
    activeProjects: 0,
    overdueTasks: 0,
    pipelineValue: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const kpis = [
    { label: 'New Leads', value: metrics.newLeads, color: 'bg-blue-500' },
    { label: 'Active Leads', value: metrics.activeLeads, color: 'bg-purple-500' },
    { label: 'Meetings', value: metrics.meetings, color: 'bg-green-500' },
    { label: 'Proposals', value: metrics.proposals, color: 'bg-yellow-500' },
    { label: 'Won Clients', value: metrics.wonClients, color: 'bg-emerald-500' },
    { label: 'Active Projects', value: metrics.activeProjects, color: 'bg-indigo-500' },
    { label: 'Overdue Tasks', value: metrics.overdueTasks, color: 'bg-red-500' },
    { label: 'Pipeline Value', value: `$${metrics.pipelineValue.toLocaleString()}`, color: 'bg-pink-500' },
  ];

  if (isLoading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to Joshua OS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${kpi.color} w-3 h-3 rounded-full mr-3`}></div>
              <p className="text-sm text-gray-600">{kpi.label}</p>
            </div>
            <p className="text-3xl font-bold mt-2 text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <p className="text-gray-600 text-center py-8">No recent activity yet</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/contacts/new" className="block px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 text-center">
              New Contact
            </a>
            <a href="/projects/new" className="block px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 text-center">
              New Project
            </a>
            <a href="/tasks/new" className="block px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 text-center">
              New Task
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
