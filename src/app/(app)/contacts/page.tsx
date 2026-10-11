'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  businessName?: string;
  phone?: string;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const response = await fetch(`/api/contacts?${params}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <Link href="/contacts/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Contact
        </Link>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search by name, email, or business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          No contacts found. <Link href="/contacts/new" className="text-blue-600 hover:underline">Create one</Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Business</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{contact.firstName} {contact.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{contact.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{contact.businessName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{contact.phone}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <Link href={`/contacts/${contact.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
