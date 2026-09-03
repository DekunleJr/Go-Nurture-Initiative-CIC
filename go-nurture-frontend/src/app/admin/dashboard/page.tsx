"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, LogOut, Users, ClipboardList, Clock, Heart, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type {
  Cohort,
  CommunityPartner,
  Contact,
  Donation,
  Facilitator,
  Partner,
  Referral,
  SessionReview,
  Stats,
  Venue,
  EmailTemplate,
} from "@/types";
import { PortalNavbar } from "@/components/portal/PortalNavbar";
import OverviewTab from "./components/OverviewTab";
import ReferralsTab from "./components/ReferralsTab";
import PartnersTab from "./components/PartnersTab";
import VenuesTab from "./components/VenuesTab";
import CohortsTab from "./components/CohortsTab";
import DonationsTab from "./components/DonationsTab";
import ContactsTab from "./components/ContactsTab";
import EmailLogsTab from "./components/EmailLogsTab";
import EmailTemplatesTab from "./components/EmailTemplatesTab";
import CommunityPartnersTab from "./components/CommunityPartnersTab";
import FacilitatorsTab from "./components/FacilitatorsTab";
import SessionReviewsTab from "./components/SessionReviewsTab";

type Tab = "overview" | "referrals" | "partners" | "venues" | "cohorts" | "facilitators" | "donations" | "contacts" | "emails" | "community_partners" | "session_reviews";

type Resource =
  | "stats"
  | "referrals"
  | "cohorts"
  | "partners"
  | "venues"
  | "facilitators"
  | "donations"
  | "contacts"
  | "emailTemplates"
  | "communityPartners"
  | "sessionReviews";

const TAB_RESOURCES: Record<Tab, Resource[]> = {
  overview: ["stats"],
  referrals: ["referrals", "cohorts", "stats"],
  partners: ["partners", "stats"],
  venues: ["venues", "stats"],
  cohorts: ["cohorts", "venues", "facilitators", "stats"],
  facilitators: ["facilitators", "stats"],
  donations: ["donations", "stats"],
  contacts: ["contacts", "stats"],
  emails: ["emailTemplates"],
  community_partners: ["communityPartners", "stats"],
  session_reviews: ["sessionReviews", "stats"],
};

function AdminTabSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border)">
      <div className="border-b border-(--color-border) bg-(--color-bg-sage) px-6 py-4">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="divide-y divide-gray-200">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-4">
            <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
            <div className="ml-auto h-6 w-16 animate-pulse rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationTotal, setDonationTotal] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [communityPartners, setCommunityPartners] = useState<CommunityPartner[]>([]);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [sessionReviews, setSessionReviews] = useState<SessionReview[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadedResourcesRef = useRef<Set<Resource>>(new Set());
  const [tabLoading, setTabLoading] = useState<Tab | null>(null);

  const ensureAdmin = useCallback(() => {
    const partnerStr = localStorage.getItem("partner");

    if (!authClient.isLoggedIn() || !partnerStr) {
      router.push("/portal/login");
      return false;
    }

    const partner = JSON.parse(partnerStr);
    if (!partner.is_admin) {
      router.push("/portal/dashboard");
      return false;
    }

    setIsAdmin(true);
    return true;
  }, [router]);

  const fetchResource = useCallback(async (resource: Resource) => {
    switch (resource) {
      case "stats":
        setStats(await api.get<Stats>("/api/admin/stats"));
        break;
      case "referrals": {
        const data = await api.get<{ referrals?: Referral[] }>("/api/admin/referrals?limit=20");
        setReferrals(data.referrals || []);
        break;
      }
      case "cohorts":
        setCohorts(await api.get<Cohort[]>("/api/admin/cohorts"));
        break;
      case "partners":
        setPartners(await api.get<Partner[]>("/api/admin/partners"));
        break;
      case "venues":
        setVenues(await api.get<Venue[]>("/api/admin/venues"));
        break;
      case "facilitators":
        setFacilitators(await api.get<Facilitator[]>("/api/admin/facilitators"));
        break;
      case "donations": {
        const data = await api.get<{ donations?: Donation[]; total_amount?: number }>("/api/admin/donations");
        setDonations(data.donations || []);
        setDonationTotal(data.total_amount || 0);
        break;
      }
      case "contacts": {
        const data = await api.get<{ contacts?: Contact[] }>("/api/admin/contacts");
        setContacts(data.contacts || []);
        break;
      }
      case "emailTemplates":
        setEmailTemplates(await api.get<EmailTemplate[]>("/api/admin/email-templates"));
        break;
      case "communityPartners":
        setCommunityPartners(await api.get<CommunityPartner[]>("/api/admin/community-partners"));
        break;
      case "sessionReviews":
        setSessionReviews(await api.get<SessionReview[]>("/api/admin/session-reviews"));
        break;
    }
  }, []);

  const loadResources = useCallback(
    async (resources: Resource[], opts?: { force?: boolean }) => {
      if (!ensureAdmin()) return;

      const pending = opts?.force
        ? resources
        : resources.filter((r) => !loadedResourcesRef.current.has(r));
      if (pending.length === 0) return;

      try {
        await Promise.all(pending.map((r) => fetchResource(r)));
        pending.forEach((r) => loadedResourcesRef.current.add(r));
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load dashboard data");
      }
    },
    [ensureAdmin, fetchResource]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      await loadResources(["stats"]);
      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [loadResources]);

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);

    const pending = TAB_RESOURCES[tab].filter((r) => !loadedResourcesRef.current.has(r));
    if (pending.length === 0) return;

    setTabLoading(tab);
    await loadResources(TAB_RESOURCES[tab]);
    setTabLoading(null);
  };

  const refreshCurrentTab = async () => {
    setRefreshing(true);
    await loadResources(TAB_RESOURCES[activeTab], { force: true });
    setRefreshing(false);
  };

  const updateReferralStatus = async (referralId: string, status: string, cohortId?: string) => {
    try {
      await api.patch(`/api/admin/referrals/${referralId}`, { status, cohort_id: cohortId || null });
      toast.success("Referral updated successfully");
      refreshCurrentTab();
    } catch (error) {
      toast.error("Error updating referral" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  const editReferral = async (referralId: string, data: Record<string, unknown>) => {
    try {
      await api.patch(`/api/admin/referrals/${referralId}/edit`, data);
    } catch (error) {
      toast.error("Error updating referral" + (error instanceof Error ? `: ${error.message}` : ""));
      throw error;
    }
  };

  const createFacilitator = async (data: { name: string; email: string; phone: string }) => {
    try {
      await api.post("/api/auth/admin/create-facilitator", data);
    } catch (error) {
      toast.error("Error creating facilitator" + (error instanceof Error ? `: ${error.message}` : ""));
      throw error;
    }
  };

  const assignFacilitator = async (cohortId: string, facilitatorId: string) => {
    try {
      await api.post(`/api/admin/cohorts/${cohortId}/assign-facilitator`, { facilitator_id: facilitatorId });

      toast.success("Facilitator assigned — they have been emailed the cohort details");
      refreshCurrentTab();
    } catch (error) {
      toast.error("Error assigning facilitator" + (error instanceof Error ? `: ${error.message}` : ""));
      throw error;
    }
  };

  const createPartner = async (partnerData: {
    organisation_name: string;
    contact_name: string;
    email: string;
    phone: string;
    organisation_type: string;
  }) => {
    await api.post("/api/auth/admin/create-partner", partnerData);
  };

  const updatePartner = async (partnerId: string, updateData: {
    organisation_name?: string;
    contact_name?: string;
    phone?: string;
    organisation_type?: string;
    is_admin?: boolean;
  }) => {
    await api.patch(`/api/admin/partners/${partnerId}`, updateData);
  };

  const activatePartner = async (partnerId: string) => {
    await api.patch(`/api/admin/partners/${partnerId}/activate`);
  };

  const deactivatePartner = async (partnerId: string) => {
    await api.patch(`/api/admin/partners/${partnerId}/deactivate`);
  };

  const resendInvite = async (partnerId: string) => {
    try {
      await api.post(`/api/auth/admin/resend-invite/${partnerId}`);
      toast.success("Invitation email resent successfully");
    } catch (error) {
      toast.error("Failed to resend invite" + (error instanceof Error ? `: ${error.message}` : ""));
      throw error;
    }
  };

  const createVenue = async (venueData: {
    name: string;
    address: string;
    city: string;
    postcode: string | null;
    capacity: number;
    description: string;
    transport_links: string;
    nearby_landmarks: string;
    accessibility_info: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    await api.post("/api/admin/venues", venueData);
  };

  const updateVenue = async (
    venueId: string,
    venueData: {
      name: string;
      address: string;
      city: string;
      postcode: string | null;
      capacity: number;
      description: string;
      transport_links: string;
      nearby_landmarks: string;
      accessibility_info: string;
      latitude?: number | null;
      longitude?: number | null;
    }
  ) => {
    await api.patch(`/api/admin/venues/${venueId}`, venueData);
  };

  const deleteVenue = async (venueId: string) => {
    await api.delete(`/api/admin/venues/${venueId}`);
  };

  const toggleVenueActive = async (venueId: string, isActive: boolean) => {
    await api.patch(`/api/admin/venues/${venueId}`, { is_active: isActive });
  };

  const createCohort = async (cohortData: {
    name: string;
    year: number;
    cohort_type: string;
    start_date: string;
    end_date: string | null;
    max_participants: number;
    venue_id: string;
  }) => {
    await api.post("/api/admin/cohorts", cohortData);
  };

  const updateCohort = async (
    cohortId: string,
    cohortData: {
      name: string;
      year: number;
      cohort_type: string;
      start_date: string;
      end_date: string | null;
      max_participants: number;
      venue_id: string;
    }
  ) => {
    await api.patch(`/api/admin/cohorts/${cohortId}`, cohortData);
  };

  const deleteCohort = async (cohortId: string) => {
    await api.delete(`/api/admin/cohorts/${cohortId}`);
  };

  const createCommunityPartner = async (name: string) => {
    await api.post("/api/admin/community-partners", { name });
  };

  const updateCommunityPartner = async (partnerId: string, name: string) => {
    await api.patch(`/api/admin/community-partners/${partnerId}`, { name });
  };

  const deleteCommunityPartner = async (partnerId: string) => {
    await api.delete(`/api/admin/community-partners/${partnerId}`);
  };

  const toggleCommunityPartnerStatus = async (partnerId: string, isActive: boolean) => {
    // Optimistic update: move the toggle immediately in the UI
    setCommunityPartners((prev) =>
      prev.map((p) => (p.id === partnerId ? { ...p, is_active: isActive } : p))
    );

    try {
      await api.patch(`/api/admin/community-partners/${partnerId}`, { is_active: isActive });
      toast.success(`Partner ${isActive ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      // Revert the optimistic update on error
      setCommunityPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, is_active: !isActive } : p))
      );
      toast.error("Error updating partner status" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  const handleLogout = () => {
    api.post("/api/auth/logout").finally(() => {
      authClient.clear();
      router.push("/portal/login");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--color-bg-cream)">
        <PortalNavbar
          title="Admin Dashboard"
          subtitle="Go Nurture Initiative · Management Console"
          actions={
            <>
              <button
                onClick={refreshCurrentTab} aria-label="Refresh"
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-primary) sm:px-4 transition hover:bg-(--color-bg-sage) disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
              <Link
                href="/portal/dashboard" aria-label="Portal"
                className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-3 py-2 text-sm font-medium text-white transition hover:bg-(--color-accent-dark) sm:px-4"
              >
                <Users size={16} /><span className="hidden sm:inline">Portal</span>
              </Link>
              <button
                onClick={handleLogout} aria-label="Sign out"
                className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-primary) sm:px-4 transition hover:bg-(--color-bg-sage)"
              >
                <LogOut size={16} /><span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          }
        />

        {/* Hero Header (structure shown while loading) */}
        <header className="relative overflow-hidden bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) text-white">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-float" />
            <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-(--color-accent-light)/30 blur-2xl animate-float-slow" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="flex flex-col gap-5 animate-fade-in-up sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-white/70">Welcome back</p>
                <h2 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
                  <span className="font-accent italic">Admin</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
                  Manage referrals, partners, cohorts and analytics across the initiative.
                </p>
              </div>

              {/* Skeleton pills */}
              <div className="flex shrink-0 flex-wrap gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-white/20" />
                    <div className="space-y-1.5">
                      <div className="h-5 w-10 animate-pulse rounded bg-white/25" />
                      <div className="h-2.5 w-12 animate-pulse rounded bg-white/15" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* Skeleton stat cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-7 w-12 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton tab bar */}
          <div className="mb-6 flex gap-4 overflow-x-auto whitespace-nowrap border-b border-(--color-border) sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="pb-4">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
          {/* Skeleton content card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border)">
            <div className="border-b border-(--color-border) bg-(--color-bg-sage) px-6 py-4">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-6 py-4">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="ml-auto h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-(--color-bg-cream)">
      <PortalNavbar
        title="Admin Dashboard"
        subtitle="Go Nurture Initiative · Management Console"
        actions={
          <>
                        <button
              onClick={refreshCurrentTab} aria-label="Refresh"
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-primary) sm:px-4 transition hover:bg-(--color-bg-sage) disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            <Link
              href="/portal/dashboard" aria-label="Portal"
              className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-3 py-2 text-sm font-medium text-white transition hover:bg-(--color-accent-dark) sm:px-4"
            >
              <Users size={16} /><span className="hidden sm:inline">Portal</span>
            </Link>
            <button
              onClick={handleLogout} aria-label="Sign out"
              className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-primary) sm:px-4 transition hover:bg-(--color-bg-sage)"
            >
              <LogOut size={16} /><span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        }
      />

      {/* ===== Hero Header ===== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-float" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-(--color-accent-light)/30 blur-2xl animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-5 animate-fade-in-up sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-white/70">Welcome back</p>
                <h2 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
                  <span className="font-accent italic">Admin</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
                  Manage referrals, partners, cohorts and analytics across the initiative.
                </p>
              </div>

              {/* Quick stats */}
              {stats && (
                <div className="flex flex-wrap gap-3 animate-fade-in-up animation-delay-200">
                  {[
                    { label: "Partners", value: stats.total_partners, icon: <Users size={16} /> },
                    { label: "Referrals", value: stats.total_referrals, icon: <ClipboardList size={16} /> },
                    { label: "Pending", value: stats.pending_referrals, icon: <Clock size={16} /> },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                        {s.icon}
                      </span>
                      <div>
                        <p className="text-xl font-bold leading-none">{s.value}</p>
                        <p className="mt-1 text-xs text-white/70">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* Stat strip */}
        {stats && (
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Total partners</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{stats.total_partners}</p>
                </div>
                <div className="rounded-xl bg-(--color-bg-sage) p-3 text-(--color-accent)">
                  <Users size={22} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Facilitators</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{stats.total_facilitators}</p>
                </div>
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
                  <GraduationCap size={22} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Pending referrals</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{stats.pending_referrals}</p>
                </div>
                <div className="rounded-xl bg-yellow-50 p-3 text-yellow-700">
                  <Clock size={22} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Cohorts</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{stats.total_cohorts}</p>
                </div>
                <div className="rounded-xl bg-green-50 p-3 text-green-700">
                  <ClipboardList size={22} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Donations</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">
                    £{stats.total_donation_amount.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-3 text-red-700">
                  <Heart size={22} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-(--color-border)">
          <nav className="-mb-px flex gap-4 overflow-x-auto whitespace-nowrap sm:gap-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "referrals", label: "Referrals" },
              { id: "partners", label: "Partners" },
              { id: "venues", label: "Venues" },
              { id: "cohorts", label: "Cohorts" },
              { id: "facilitators", label: "Facilitators" },
              { id: "donations", label: "Donations" },
              { id: "contacts", label: "Contacts" },
              { id: "emails", label: "Emails" },
              { id: "community_partners", label: "Community Partners" },
              { id: "session_reviews", label: "Session Reviews" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as Tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-(--color-accent) text-(--color-accent)"
                    : "border-transparent text-(--color-text-muted) hover:border-(--color-accent-light) hover:text-(--color-primary)"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {tabLoading === activeTab ? (
          <AdminTabSkeleton />
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewTab stats={stats} />
            )}

        {activeTab === "referrals" && (
          <ReferralsTab
            referrals={referrals}
            cohorts={cohorts}
            onUpdateStatus={updateReferralStatus}
            onEditReferral={editReferral}
            onRefresh={refreshCurrentTab}
          />
        )}

        {activeTab === "partners" && (
          <PartnersTab
            partners={partners}
            onActivate={activatePartner}
            onDeactivate={deactivatePartner}
            onCreatePartner={createPartner}
            onUpdatePartner={updatePartner}
            onResendInvite={resendInvite}
            onRefresh={refreshCurrentTab}
          />
        )}

        {activeTab === "venues" && (
          <VenuesTab
            venues={venues}
            onCreateVenue={createVenue}
            onUpdateVenue={updateVenue}
            onDeleteVenue={deleteVenue}
            onToggleVenueActive={toggleVenueActive}
            onRefresh={refreshCurrentTab}
          />
        )}

        {activeTab === "cohorts" && (
          <CohortsTab
            cohorts={cohorts}
            venues={venues}
            facilitators={facilitators}
            onAssignFacilitator={assignFacilitator}
            onCreateCohort={createCohort}
            onUpdateCohort={updateCohort}
            onDeleteCohort={deleteCohort}
            onRefresh={refreshCurrentTab}
          />
        )}

        {activeTab === "facilitators" && (
          <FacilitatorsTab
            facilitators={facilitators}
            onCreateFacilitator={createFacilitator}
            onRefresh={refreshCurrentTab}
          />
        )}

        {activeTab === "donations" && (
          <DonationsTab donations={donations} totalAmount={donationTotal} />
        )}

        {activeTab === "contacts" && (
          <ContactsTab contacts={contacts} />
        )}

        {activeTab === "emails" && (
          <div className="space-y-6">
            <EmailTemplatesTab initialTemplates={emailTemplates} />
            <EmailLogsTab />
          </div>
        )}

        {activeTab === "community_partners" && (
          <CommunityPartnersTab
            partners={communityPartners}
            onCreatePartner={createCommunityPartner}
            onUpdatePartner={updateCommunityPartner}
            onDeletePartner={deleteCommunityPartner}
            onToggleStatus={toggleCommunityPartnerStatus}
            onRefresh={refreshCurrentTab}
          />
        )}

        {activeTab === "session_reviews" && (
          <SessionReviewsTab reviews={sessionReviews} />
        )}
          </>
        )}
      </div>
    </div>
  );
}
