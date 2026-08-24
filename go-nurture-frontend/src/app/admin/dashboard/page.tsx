"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
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
      const [statsData, referralsData, partnersData, venuesData, cohortsData, donationsData, contactsData, communityPartnersData, facilitatorsData, sessionReviewsData, emailTemplatesData] = await Promise.all([
        api.get<Stats>("/api/admin/stats"),
        api.get<{ referrals?: Referral[] }>("/api/admin/referrals?limit=20"),
        api.get<Partner[]>("/api/admin/partners"),
        api.get<Venue[]>("/api/admin/venues"),
        api.get<Cohort[]>("/api/admin/cohorts"),
        api.get<{ donations?: Donation[]; total_amount?: number }>("/api/admin/donations"),
        api.get<{ contacts?: Contact[] }>("/api/admin/contacts"),
        api.get<CommunityPartner[]>("/api/admin/community-partners"),
        api.get<Facilitator[]>("/api/admin/facilitators"),
        api.get<SessionReview[]>("/api/admin/session-reviews"),
        api.get<EmailTemplate[]>("/api/admin/email-templates"),
      ]);

      setStats(statsData);
      setReferrals(referralsData.referrals || []);
      setPartners(partnersData);
      setVenues(venuesData);
      setCohorts(cohortsData);
      setDonations(donationsData.donations || []);
      setDonationTotal(donationsData.total_amount || 0);
      setContacts(contactsData.contacts || []);
      setCommunityPartners(communityPartnersData);
      setFacilitators(facilitatorsData);
      setSessionReviews(sessionReviewsData);
      setEmailTemplates(emailTemplatesData);
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
    try {
      await api.patch(`/api/admin/referrals/${referralId}`, { status, cohort_id: cohortId || null });
      toast.success("Referral updated successfully");
      fetchData();
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
      fetchData();
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
      latitude?: number | null;
      longitude?: number | null;
    }
  ) => {
    await api.patch(`/api/admin/venues/${venueId}`, venueData);
  };

  const deleteVenue = async (venueId: string) => {
    await api.delete(`/api/admin/venues/${venueId}`);
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-(--color-primary) px-4 py-2 text-white hover:bg-(--color-primary)/90 disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
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
            onEditReferral={editReferral}
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
            onResendInvite={resendInvite}
            onRefresh={fetchData}
          />
        )}

        {activeTab === "venues" && (
          <VenuesTab
            venues={venues}
            onCreateVenue={createVenue}
            onUpdateVenue={updateVenue}
            onDeleteVenue={deleteVenue}
            onRefresh={fetchData}
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
            onRefresh={fetchData}
          />
        )}

        {activeTab === "facilitators" && (
          <FacilitatorsTab
            facilitators={facilitators}
            onCreateFacilitator={createFacilitator}
            onRefresh={fetchData}
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
            onRefresh={fetchData}
          />
        )}

        {activeTab === "session_reviews" && (
          <SessionReviewsTab reviews={sessionReviews} />
        )}
      </div>
    </div>
  );
}
