"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { PortalNavbar } from "@/components/portal/PortalNavbar";
import { useLocalStorage } from "@/lib/useLocalStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Referral {
  id: string;
  mother_name: string;
  mother_phone: string;
  estimated_due_date: string;
  status: string;
  created_at: string;
}

interface PartnerData {
  contact_name: string;
  organisation_name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const partner = useLocalStorage<PartnerData>("partner");

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/portal/login");
      return;
    }

    let isMounted = true;

    fetch(`${API_URL}/api/referrals/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("The backend server is not reachable. Make sure it is running.");
        }
        const data = await res.json();
        if (isMounted) {
          setReferrals(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching referrals:", error);
        if (isMounted) {
          toast.error("Failed to load referrals. Please try again later.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-(--color-primary)">
            Partner Dashboard
          </h1>
          {partner && (
            <p className="mt-2 text-(--color-text-muted)">
              Welcome, {partner.contact_name} from {partner.organisation_name}
            </p>
          )}
        </div>

        <div className="mb-6">
          <a href="/portal/referral">
            <button className="inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-6 py-3 text-white hover:bg-(--color-primary)/90 transition-colors">
              <Plus size={18} />
              New Referral
            </button>
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FileText size={32} className="animate-spin text-(--color-primary)" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-xl border border-(--color-border) bg-white p-12 text-center">
            <FileText size={48} className="mx-auto text-(--color-text-muted) mb-4" />
            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
              No referrals yet
            </h3>
            <p className="text-(--color-text-muted)">
              Get started by submitting your first referral.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-(--color-border) bg-white">
            <table className="min-w-full divide-y divide-(--color-border)">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mother
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {referral.mother_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                      {referral.mother_phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                      {new Date(referral.estimated_due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}