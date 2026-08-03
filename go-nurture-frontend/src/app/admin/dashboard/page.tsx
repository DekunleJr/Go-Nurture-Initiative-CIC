"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { PortalNavbar } from "@/components/portal/PortalNavbar";
import OverviewTab from "./components/OverviewTab";
import ReferralsTab from "./components/ReferralsTab";
import PartnersTab from "./components/PartnersTab";
import VenuesTab from "./components/VenuesTab";
import CohortsTab from "./components/CohortsTab";

const API_BASE = "/";

interface Stats {
  total_partners: number;
  active_partners: number;
  total_referrals: number;
  pending_referrals: number;
  recent_referrals: number;
  total_donations: number;
  total_donation_amount: number;
  total_contacts: number;
  total_venues: number;
  total_cohorts: number;
  referrals_by_status: Record<string, number>;
}

interface Referral {
  id: string;
  mother_name: string;
  mother_phone: string;
  estimated_due_date: string;
  status: string;
  partner_id: string;
  created_at: string;
}

interface Partner {
  id: string;
  organisation_name: string;
  contact_name: string;
  email: string;
  phone: string;
  organisation_type: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  capacity: number;
  description: string;
}

interface Cohort {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  max_participants: number;
  venue_name: string;
}

type Tab = "overview" | "referrals" | "partners" | "venues" | "cohorts";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    const partnerStr = localStorage.getItem("partner");
    
    if (!token || !partnerStr) {
      router.push("/portal/login");
      return;
    }

    const partner = JSON.parse(partnerStr);
    if (!partner.is_admin) {
      router.push("/portal/dashboard");
      return;
    }

    setIsAdmin(true);
    setRefreshing(true);

    try {
      const [statsRes, referralsRes, partnersRes, venuesRes, cohortsRes] = await Promise.all([
        fetch(`${API_BASE}api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}api/admin/referrals?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}api/admin/partners`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}api/admin/venues`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}api/admin/cohorts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (referralsRes.ok) setReferrals((await referralsRes.json()).referrals || []);
      if (partnersRes.ok) setPartners(await partnersRes.json());
      if (venuesRes.ok) setVenues(await venuesRes.json());
      if (cohortsRes.ok) setCohorts(await cohortsRes.json());
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const updateReferralStatus = async (referralId: string, status: string, cohortId?: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}api/admin/referrals/${referralId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, cohort_id: cohortId || null }),
      });

      if (res.ok) {
        toast.success("Referral updated successfully");
        fetchData();
      } else {
        toast.error("Failed to update referral");
      }
    } catch (error) {
      toast.error("Error updating referral" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  const createPartner = async (partnerData: {
    organisation_name: string;
    contact_name: string;
    email: string;
    phone: string;
    organisation_type: string;
  }) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    await fetch(`${API_BASE}api/auth/admin/create-partner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(partnerData),
    });
  };

  const updatePartner = async (partnerId: string, updateData: {
    organisation_name?: string;
    contact_name?: string;
    phone?: string;
    organisation_type?: string;
    is_admin?: boolean;
  }) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    await fetch(`${API_BASE}api/admin/partners/${partnerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
  };

  const activatePartner = async (partnerId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    await fetch(`${API_BASE}api/admin/partners/${partnerId}/activate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const deactivatePartner = async (partnerId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    await fetch(`${API_BASE}api/admin/partners/${partnerId}/deactivate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const createVenue = async (venueData: {
    name: string;
    address: string;
    city: string;
    postcode: string;
    capacity: number;
    description: string;
  }) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    await fetch(`${API_BASE}api/admin/venues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(venueData),
    });
  };

  const deleteVenue = async (venueId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    await fetch(`${API_BASE}api/admin/venues/${venueId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const createCohort = async (cohortData: {
    name: string;
    year: number;
    start_date: string;
    end_date: string;
    max_participants: number;
    venue_id: string;
  }) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    await fetch(`${API_BASE}api/admin/cohorts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cohortData),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalNavbar />
        <div className="flex items-center justify-center py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-(--color-primary) border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold text-(--color-primary)">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-(--color-text-muted)">
              Manage referrals, partners, and view analytics
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-4 py-2 text-white hover:bg-(--color-primary)/90 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "referrals", label: "Referrals" },
              { id: "partners", label: "Partners" },
              { id: "venues", label: "Venues" },
              { id: "cohorts", label: "Cohorts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-(--color-accent) text-(--color-accent)"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab stats={stats} />
        )}

        {activeTab === "referrals" && (
          <ReferralsTab
            referrals={referrals}
            cohorts={cohorts}
            onUpdateStatus={updateReferralStatus}
            onRefresh={fetchData}
          />
        )}

        {activeTab === "partners" && (
          <PartnersTab
            partners={partners}
            onActivate={activatePartner}
            onDeactivate={deactivatePartner}
            onCreatePartner={createPartner}
            onUpdatePartner={updatePartner}
            onRefresh={fetchData}
          />
        )}

        {activeTab === "venues" && (
          <VenuesTab
            venues={venues}
            onCreateVenue={createVenue}
            onDeleteVenue={deleteVenue}
            onRefresh={fetchData}
          />
        )}

        {activeTab === "cohorts" && (
          <CohortsTab
            cohorts={cohorts}
            venues={venues}
            onCreateCohort={createCohort}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}