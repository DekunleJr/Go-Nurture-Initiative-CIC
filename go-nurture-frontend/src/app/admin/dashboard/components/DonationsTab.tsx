"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import Pagination from "./Pagination";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Heart size={48} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  donor_email: string | null;
  message: string | null;
  is_anonymous: boolean;
  status: string;
  created_at: string;
}

interface DonationsTabProps {
  donations: Donation[];
  totalAmount: number;
}

const PAGE_SIZE = 10;

export default function DonationsTab({ donations, totalAmount }: DonationsTabProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(donations.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleDonations = donations.slice(start, start + PAGE_SIZE);

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Donations ({donations.length})
        </h3>
        <div className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent)/10 px-4 py-2 text-(--color-accent)">
          <Heart size={18} />
          <span className="font-semibold">
            Total: {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleDonations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6">
                  <EmptyState message="No donations yet." />
                </td>
              </tr>
            ) : (
              visibleDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {donation.is_anonymous ? "Anonymous" : donation.donor_name || "Anonymous"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {donation.is_anonymous ? "-" : donation.donor_email || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {donation.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {donation.currency.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      donation.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : donation.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : donation.status === "failed"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {donation.message || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(donation.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={donations.length} onPageChange={setPage} />
    </div>
  );
}