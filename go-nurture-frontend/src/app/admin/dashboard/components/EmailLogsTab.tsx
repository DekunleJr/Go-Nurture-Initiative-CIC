"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Eye, X } from "lucide-react";
import { api } from "@/lib/api-client";
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
      const params = new URLSearchParams();
      params.append("limit", "20");
      if (filterType) params.append("email_type", filterType);

      const data = await api.get<{ logs?: EmailLog[] }>(`/api/admin/email-logs?${params.toString()}`);
      setLogs(data.logs || []);
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
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border) overflow-hidden">
      <div className="px-6 py-4 border-b border-(--color-border) flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Email Logs ({logs.length})
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-(--color-border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
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
        <table className="min-w-full divide-y divide-(--color-border)">
          <thead className="bg-(--color-bg-sage)">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-(--color-text-muted)">
                  Loading...
                </td>
              </tr>
            ) : visibleLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-(--color-text-muted)">
                  No email logs found.
                </td>
              </tr>
            ) : (
              visibleLogs.map((log) => (
                <tr key={log.id} className="hover:bg-(--color-bg-sage)">
                  <td className="px-6 py-4 text-sm text-gray-900">{log.recipient_email}</td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted) max-w-xs truncate">{log.subject}</td>
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
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-bold text-gray-900">Email Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-(--color-text-muted)">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-(--color-text-muted)">Recipient</p>
                <p className="font-medium text-gray-900">{selectedLog.recipient_email}</p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Subject</p>
                <p className="font-medium text-gray-900">{selectedLog.subject}</p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Type</p>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeBadge(selectedLog.email_type)}`}>
                  {selectedLog.email_type}
                </span>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Status</p>
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
                <p className="text-sm text-(--color-text-muted)">Sent At</p>
                <p className="font-medium text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage)"
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