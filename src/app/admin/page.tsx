'use client';

import { useEffect, useState } from 'react';

interface WorkspaceStats {
  id: string;
  name: string;
  users: number;
  contacts: number;
  opportunities: number;
  revenue: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const [workspaces, setWorkspaces] = useState<WorkspaceStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({ workspaces: 0, revenue: 0, contacts: 0 });

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/admin/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
        setTotalStats(data.totals);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Total Workspaces</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{totalStats.workspaces}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Total Revenue (MRR)</p>
            <p className="text-4xl font-bold text-green-600 mt-2">${totalStats.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Total Contacts</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">{totalStats.contacts.toLocaleString()}</p>
          </div>
        </div>

        {/* Workspaces Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Client Workspaces</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">Loading...</div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center text-gray-600">No workspaces yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Users</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contacts</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Deals</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">MRR</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workspaces.map((ws) => (
                  <tr key={ws.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{ws.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ws.users}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ws.contacts}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ws.opportunities}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">${ws.revenue}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ws.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a href={`/admin/workspaces/${ws.id}`} className="text-blue-600 hover:underline">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
