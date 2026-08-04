"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Eye, X } from "lucide-react";
import Pagination from "./Pagination";

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function EmailLogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();
      params.append("limit", "20");
      if (filterType) params.append("email_type", filterType);

      const res = await fetch(`/api/admin/email-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching email logs:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [filterType, fetchLogs]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleLogs = logs.slice(start, start + PAGE_SIZE);

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      referral: "bg-blue-50 text-blue-700",
      donation: "bg-green-50 text-green-700",
      contact: "bg-purple-50 text-purple-700",
      partner_invite: "bg-yellow-50 text-yellow-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") return "bg-green-50 text-green-700";
    if (status === "failed") return "bg-red-50 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Email Logs ({logs.length})
        </h3>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
          >
            <option value="">All Types</option>
            <option value="referral">Referral</option>
            <option value="donation">Donation</option>
            <option value="contact">Contact</option>
            <option value="partner_invite">Partner Invite</option>
          </select>
          <div className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent)/10 px-4 py-2 text-(--color-accent)">
            <Mail size={18} />
            <span className="font-semibold">Emails</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : visibleLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No email logs found.
                </td>
              </tr>
            ) : (
              visibleLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{log.recipient_email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeBadge(log.email_type)}`}>
                      {log.email_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View details"
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

      {visibleLogs.length > 0 && (
        <Pagination page={currentPage} pageSize={PAGE_SIZE} total={logs.length} onPageChange={setPage} />
      )}

      {/* View Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-bold text-gray-900">Email Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Recipient</p>
                <p className="font-medium text-gray-900">{selectedLog.recipient_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{selectedLog.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeBadge(selectedLog.email_type)}`}>
                  {selectedLog.email_type}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(selectedLog.status)}`}>
                  {selectedLog.status}
                </span>
              </div>
              {selectedLog.error_message && (
                <div>
                  <p className="text-sm text-red-600 font-medium">Error</p>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Sent At</p>
                <p className="font-medium text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
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