'use client';

import { useEffect, useState } from 'react';

interface Visitor {
  id: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  country?: string;
  page?: string;
  createdAt: string;
}

interface Stats {
  totalVisitors: number;
  uniqueEmails: number;
  uniqueIPs: number;
  todayVisitors: number;
  recentVisitors: Visitor[];
}

export default function TrackingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/tracking/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="text-center py-12">Cargando tracking...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">Error cargando datos</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Visitor Tracking</h1>
        <p className="text-gray-600 mt-2">Estadísticas de visitantes en tu sitio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Visitors</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">
            {stats.totalVisitors}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Unique Emails</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {stats.uniqueEmails}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Unique IPs</p>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {stats.uniqueIPs}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Today</p>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            {stats.todayVisitors}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Visitors</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Email / Visitor
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Page
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stats.recentVisitors.length > 0 ? (
              stats.recentVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {visitor.email ? (
                      <span className="text-blue-600 font-medium">{visitor.email}</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Anonymous Visitor</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">
                    {visitor.ipAddress}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {visitor.page || '(unknown)'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(visitor.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  Sin visitantes aún. Comparte el formulario público para capturar leads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
