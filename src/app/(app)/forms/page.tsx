'use client';

import Link from 'next/link';

export default function FormsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
        <Link href="/forms/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Form
        </Link>
      </div>
      <div className="text-center py-12 text-gray-600">
        Forms page coming soon
      </div>
    </div>
  );
}
