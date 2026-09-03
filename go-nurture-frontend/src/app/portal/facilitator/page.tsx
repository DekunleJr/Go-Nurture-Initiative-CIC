"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Users,
  FileText,
  ClipboardCheck,
  Pencil,
  Eye,
  LogOut,
  ShieldCheck,
  BookOpen,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { PortalNavbar } from "@/components/portal/PortalNavbar";
import SessionReviewForm from "./SessionReviewForm";
import SessionReviewViewer from "./SessionReviewViewer";
import type { SessionReview } from "@/types/api";

interface CohortMember {
  id: string;
  mother_name: string;
  mother_phone: string;
  estimated_due_date: string | null;
  status: string;
  language_requirement: string | null;
  requires_interpreter: boolean;
}

interface AssignedCohort {
  id: string;
  name: string;
  year: number;
  cohort_type: string;
  start_date: string;
  end_date: string | null;
  max_participants: number;
  description: string | null;
  schedule: string[];
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  members: CohortMember[];
}

export default function FacilitatorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [facilitatorName, setFacilitatorName] = useState("");
  const [cohorts, setCohorts] = useState<AssignedCohort[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingCohort, setReviewingCohort] = useState<AssignedCohort | null>(null);
  const [reviewingExisting, setReviewingExisting] = useState<SessionReview | null>(null);
  const [viewingReview, setViewingReview] = useState<SessionReview | null>(null);
  const [reviews, setReviews] = useState<SessionReview[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userStr = localStorage.getItem("user");
    if (!authClient.isLoggedIn()) {
      router.push("/portal/login");
      return;
    }
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== "facilitator") {
        router.push(user.role === "admin" ? "/admin/dashboard" : "/portal/dashboard");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFacilitatorName(user.name || "Facilitator");
    }

    let isMounted = true;

    Promise.all([
      api.get<AssignedCohort[]>("/api/facilitator/my-cohorts"),
      api.get<SessionReview[]>("/api/facilitator/reviews"),
    ])
      .then(([cohortData, reviewData]) => {
        if (isMounted) {
          setCohorts(cohortData);
          setReviews(reviewData);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const refreshReviews = () => {
    api.get<SessionReview[]>("/api/facilitator/reviews")
      .then(setReviews)
      .catch((error) => console.error(error));
  };

  // Derived dashboard stats
  const stats = useMemo(() => {
    const totalMothers = cohorts.reduce((sum, c) => sum + c.members.length, 0);
    const submitted = reviews.filter((r) => r.status === "submitted").length;
    const drafts = reviews.filter((r) => r.status === "draft").length;
    return { cohorts: cohorts.length, mothers: totalMothers, submitted, drafts };
  }, [cohorts, reviews]);

  const firstName = facilitatorName.trim().split(/\s+/)[0] || "Facilitator";

  const openEditReview = (review: SessionReview) => {
    const cohort = cohorts.find((c) => c.id === review.cohort_id);
    if (cohort) {
      setReviewingCohort(cohort);
    } else {
      // Cohort no longer assigned — open with the review's own data so it stays editable.
      setReviewingCohort({
        id: review.cohort_id,
        name: review.cohort_name || "Cohort",
        year: 0,
        cohort_type: "birth_confidence",
        start_date: review.session_date,
        end_date: null,
        max_participants: 0,
        description: null,
        schedule: [review.session_date],
        venue_name: null,
        venue_address: null,
        venue_city: null,
        members: [],
      });
    }
    setReviewingExisting(review);
  };

  return (
    <div className="min-h-screen bg-(--color-bg-cream)">
      <PortalNavbar
        title="Facilitator Portal"
        subtitle="Go Nurture Initiative · Delivery Audits"
        actions={
          <button
            aria-label="Sign out"
            onClick={() => {
              api.post("/api/auth/logout").finally(() => {
                authClient.clear();
                router.push("/portal/login");
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-primary) sm:px-4 transition hover:bg-(--color-bg-sage)"
          >
            <LogOut size={16} /><span className="hidden sm:inline">Sign out</span>
          </button>
        }
      />

      {/* ===== Hero Header ===== */}
      <header className="relative overflow-hidden bg-(--color-primary) bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) text-white">
        {/* Decorative floating shapes */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-float" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-(--color-accent-light)/30 blur-2xl animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {/* Greeting */}
          <div className="flex flex-col gap-5 animate-fade-in-up sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-white/70">Welcome back</p>
              <h2 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
                <span className="font-accent italic">{firstName}</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
                Your assigned cohorts, schedules and delivery audits — all in one place.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 animate-fade-in-up animation-delay-200">
              {[
                { label: "Cohorts", value: stats.cohorts, icon: <BookOpen size={16} /> },
                { label: "Mothers", value: stats.mothers, icon: <Users size={16} /> },
                { label: "Reviews", value: stats.submitted + stats.drafts, icon: <ClipboardList size={16} /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
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
          </div>
        </div>
      </header>

      {/* ========= Main Content ========= */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Sub-stat strip */}
        {loading ? (
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
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
        ) : (
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-(--color-text-muted)">Pending drafts</p>
                <p className="mt-1 text-3xl font-bold text-(--color-primary)">{stats.drafts}</p>
              </div>
              <div className="rounded-xl bg-(--color-bg-sage) p-3 text-(--color-accent)">
                <ClipboardList size={22} />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-(--color-text-muted)">Submitted reviews</p>
                <p className="mt-1 text-3xl font-bold text-(--color-primary)">{stats.submitted}</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3 text-green-700">
                <ShieldCheck size={22} />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-(--color-text-muted)">Mothers to support</p>
                <p className="mt-1 text-3xl font-bold text-(--color-primary)">{stats.mothers}</p>
              </div>
              <div className="rounded-xl bg-yellow-50 p-3 text-yellow-700">
                <Sparkles size={22} />
              </div>
            </div>
          </div>
          </div>
        )}

        {/* My Session Reviews */}
        {!loading && (
          <section className="mt-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-(--color-primary)" />
              <h3 className="font-heading text-2xl font-bold text-(--color-primary)">My Session Reviews</h3>
            </div>
            <p className="mt-1 text-sm text-(--color-text-muted)">
              Drafts can be edited and submitted later; submitted reviews are read-only.
            </p>
            {reviews.length === 0 ? (
              <p className="mt-4 text-gray-500">You have not added any session reviews yet.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex items-center gap-4 px-6 py-4 hover:bg-(--color-bg-sage)">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{review.cohort_name || "Cohort"}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{formatDate(review.session_date)}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          review.status === "submitted"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {review.status === "submitted" ? "Submitted" : "Draft"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingReview(review)}
                          className="inline-flex items-center gap-1 rounded-lg border border-(--color-border) px-3 py-1.5 text-sm font-medium text-(--color-accent) hover:bg-(--color-bg-sage)"
                        >
                          <Eye size={14} /> View
                        </button>
                        {review.status !== "submitted" && (
                          <button
                            onClick={() => openEditReview(review)}
                            className="inline-flex items-center gap-1 rounded-lg border border-(--color-border) px-3 py-1.5 text-sm font-medium text-(--color-primary) hover:bg-(--color-bg-sage)"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {loading ? (
          <div className="mt-6 space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border)">
                <div className="flex items-center gap-3 border-b border-(--color-border) bg-(--color-bg-sage) px-6 py-4">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
                <div className="px-6 py-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="h-10 animate-pulse rounded-lg bg-gray-200" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : cohorts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-(--color-border) bg-white p-12 text-center shadow-sm">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-heading text-xl font-semibold text-gray-800 mb-2">No cohorts assigned yet</h3>
            <p className="text-gray-500">You will see your cohorts here once an administrator assigns you.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {cohorts.map((cohort) => (
              <div key={cohort.id} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border) transition hover:shadow-lg hover:-translate-y-0.5">
                {/* Cohort header */}
                <div className="flex flex-col gap-3 border-b border-(--color-border) bg-(--color-bg-sage) px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-primary) text-white shadow-sm">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-(--color-primary)">{cohort.name}</h3>
                      <p className="text-sm text-(--color-text-muted)">
                        {cohort.cohort_type === "breastfeeding_clinic"
                          ? "Breastfeeding Support Clinic"
                          : "Favour Oloye Birth Confidence Program"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setReviewingExisting(null);
                        setReviewingCohort(cohort);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-sm text-white shadow-sm transition hover:bg-(--color-accent-dark) hover:shadow"
                    >
                      <ClipboardCheck size={16} /> Submit Review
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === cohort.id ? null : cohort.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-(--color-primary) px-4 py-2 text-sm font-medium text-(--color-primary) transition hover:bg-(--color-primary) hover:text-white"
                    >
                      <Users size={16} />
                      {expandedId === cohort.id ? "Hide Mothers" : "View Mothers"}
                      <span className="rounded-full bg-(--color-primary)/10 px-2 py-0.5 text-xs font-bold text-(--color-primary)">
                        {cohort.members.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  {/* Schedule */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted) mb-3 flex items-center gap-1">
                        <CalendarDays size={14} className="text-(--color-accent)" /> Schedule
                      </p>
                      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {cohort.schedule.map((date, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-(--color-accent)"
                          >
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-bg-sage) text-xs font-semibold text-(--color-primary)">
                              {i + 1}
                            </span>
                            {formatDate(date)}
                          </li>
                        ))}
                      </ol>

                      {/* Venue */}
                      {cohort.venue_name && (
                        <p className="mt-4 flex items-start gap-1.5 text-sm text-(--color-text-muted)">
                          <MapPin size={14} className="mt-0.5 text-(--color-accent)" />
                          {cohort.venue_name}
                          {(cohort.venue_address || cohort.venue_city) &&
                            ` — ${[cohort.venue_address, cohort.venue_city].filter(Boolean).join(", ")}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Members */}
                {expandedId === cohort.id && (
                  <div className="mx-6 mb-6 rounded-xl bg-(--color-bg-sage) p-4">
                    {cohort.members.length === 0 ? (
                      <p className="py-4 text-center text-sm text-(--color-text-muted)">No mothers enrolled yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-(--color-border) bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-(--color-bg-sage)">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Mother</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Phone</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Due Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Language</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Interpreter</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {cohort.members.map((m) => (
                              <tr key={m.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.mother_name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{m.mother_phone}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{m.estimated_due_date ? new Date(m.estimated_due_date).toLocaleDateString() : "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{m.language_requirement || "-"}</td>
                                <td className="px-4 py-3 text-sm">
                                  {m.requires_interpreter ? (
                                    <span className="inline-flex rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">Yes</span>
                                  ) : (
                                    <span className="text-gray-500">No</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                      <FileText size={12} /> Use &quot;Submit Review&quot; after each meeting to complete the delivery audit.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Review Modal */}
      {reviewingCohort && (
        <SessionReviewForm
          cohortId={reviewingCohort.id}
          cohortName={reviewingCohort.name}
          schedulePreview={reviewingCohort.schedule.map((d, i) => `Class ${i + 1}: ${formatDate(d)}`).join(" · ")}
          venueName={reviewingCohort.venue_name}
          facilitatorName={facilitatorName}
          memberCount={reviewingCohort.members.length}
          existingReview={reviewingExisting}
          onClose={() => {
            setReviewingCohort(null);
            setReviewingExisting(null);
            refreshReviews();
          }}
        />
      )}

      {/* Read-only Session Review Viewer */}
      {viewingReview && (
        <SessionReviewViewer
          review={viewingReview}
          onClose={() => setViewingReview(null)}
        />
      )}
    </div>
  );
}