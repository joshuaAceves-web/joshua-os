'use client';

import Link from 'next/link';

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <Link href="/tasks/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Task
        </Link>
      </div>
      <div className="text-center py-12 text-gray-600">
        Tasks page coming soon
      </div>
    </div>
  );
}
