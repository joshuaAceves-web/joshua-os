'use client';

import { useEffect, useState } from 'react';

interface JobStatus {
  total: number;
  pending: number;
  delayed: number;
  processing: number;
  success: number;
  failed: number;
}

export default function JobsPage() {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/jobs/status');
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch jobs status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="text-center py-12">Loading job queue...</div>;
  }

  if (!status) {
    return <div className="text-center py-12">Failed to load job status</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Queue</h1>
        <p className="text-gray-600 mt-2">Manage background jobs and automations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{status.total}</p>
        </div>

        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-blue-600">Pending</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{status.pending}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600">Delayed</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{status.delayed}</p>
        </div>

        <div className="bg-purple-50 rounded-lg shadow p-4">
          <p className="text-sm text-purple-600">Processing</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{status.processing}</p>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Success</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{status.success}</p>
        </div>

        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Failed</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{status.failed}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {status.total > 0
                  ? Math.round((status.success / status.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{
                  width: `${status.total > 0 ? (status.success / status.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Queue Running</h3>
            <p className="text-sm text-gray-600">
              {status.processing > 0
                ? `${status.processing} job(s) currently processing`
                : 'No jobs processing. Start the worker with `npm run worker`'}
            </p>
            {status.processing === 0 && status.pending > 0 && (
              <p className="text-sm text-yellow-600 mt-2">
                ⚠️ {status.pending} pending job(s) waiting to be processed
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Worker Status</h3>
        <p className="text-sm text-blue-800">
          To process background jobs, run the worker in a separate terminal:
        </p>
        <div className="bg-white rounded p-3 mt-3 font-mono text-sm text-gray-900">
          npm run worker
        </div>
        <p className="text-xs text-blue-700 mt-3">
          The worker processes emails, SMS, waits, and other background tasks. It can run on the
          same server or separately.
        </p>
      </div>
    </div>
  );
}
