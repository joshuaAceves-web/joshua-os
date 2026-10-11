'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';

interface SidebarProps {
  user?: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const menuItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/inbox', label: '📬 Inbox' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/pipeline', label: 'Pipeline' },
    { href: '/projects', label: 'Projects' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/forms', label: 'Forms' },
    { href: '/automations', label: 'Automations' },
    { href: '/messages', label: '💬 Messages' },
    { href: '/bookings', label: '📅 Bookings' },
    { href: '/email-templates', label: '📧 Email Templates' },
    { href: '/tracking', label: '📍 Tracking' },
    { href: '/jobs', label: '⚙️ Job Queue' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Joshua OS</h1>
        <p className="text-sm text-gray-400 mt-1">Business Management</p>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-3 rounded-lg text-sm hover:bg-gray-800 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-700 space-y-4">
        <div className="text-sm">
          <p className="text-gray-400">Logged in as</p>
          <p className="font-medium truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/auth/login' })}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg transition text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
