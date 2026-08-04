"use client";

import { useState } from "react";
import { Mail, Eye, X, Search } from "lucide-react";
import Pagination from "./Pagination";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Mail size={48} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

interface ContactsTabProps {
  contacts: Contact[];
}

const PAGE_SIZE = 10;

export default function ContactsTab({ contacts }: ContactsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      c.message.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleContacts = filteredContacts.slice(start, start + PAGE_SIZE);

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Contact Submissions ({contacts.length})
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent)/10 px-4 py-2 text-(--color-accent)">
            <Mail size={18} />
            <span className="font-semibold">Enquiries</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6">
                  <EmptyState message="No contact submissions yet." />
                </td>
              </tr>
            ) : (
              visibleContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{contact.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{contact.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{contact.subject || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{contact.message}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedContact(contact)}
                      className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View message"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filteredContacts.length} onPageChange={setPage} />

      {/* View Message Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-bold text-gray-900">Message Details</h3>
              <button onClick={() => setSelectedContact(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{selectedContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{selectedContact.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{selectedContact.subject || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date Submitted</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedContact.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Message</p>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-800 whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedContact(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}