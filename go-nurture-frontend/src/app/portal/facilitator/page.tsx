"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Users, FileText, GraduationCap, ClipboardCheck, Pencil } from "lucide-react";
import { api } from "@/lib/api-client";
import SessionReviewForm from "./SessionReviewForm";
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
  const [reviews, setReviews] = useState<SessionReview[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    if (!token) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={22} className="text-(--color-primary)" />
            <h1 className="font-heading text-xl font-bold text-(--color-primary)">Facilitator Portal</h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("user");
              router.push("/portal/login");
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-bold text-(--color-primary)">Welcome, {facilitatorName}</h2>
        <p className="mt-2 text-(--color-text-muted)">
          Your assigned cohorts and their schedules. Open a cohort to view enrolled mothers, or submit a delivery review after a meeting.
        </p>

        {/* My Session Reviews */}
        {!loading && (
          <section className="mt-10">
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
              <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex items-center gap-4 px-6 py-4">
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
                      {review.status !== "submitted" && (
                        <button
                          onClick={() => openEditReview(review)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {loading ? (
          <p className="mt-10 text-gray-500">Loading your cohorts...</p>
        ) : cohorts.length === 0 ? (
          <div className="mt-10 rounded-xl border border-gray-200 bg-white p-12 text-center">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-heading text-xl font-semibold text-gray-800 mb-2">No cohorts assigned yet</h3>
            <p className="text-gray-500">You will see your cohorts here once an administrator assigns you.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {cohorts.map((cohort) => (
              <div key={cohort.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-gray-900">{cohort.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {cohort.cohort_type === "breastfeeding_clinic"
                          ? "Breastfeeding Support Clinic"
                          : "Favour Oloye Birth Confidence Program"}
                        {" · "}
                        {cohort.members.length} enrolled
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setReviewingExisting(null);
                          setReviewingCohort(cohort);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-sm text-white hover:bg-(--color-accent)/90"
                      >
                        <ClipboardCheck size={16} /> Submit Review
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === cohort.id ? null : cohort.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-4 py-2 text-sm text-white hover:bg-(--color-primary)/90"
                      >
                        <Users size={16} />
                        {expandedId === cohort.id ? "Hide Mothers" : "View Mothers"}
                      </button>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                      <CalendarDays size={14} /> Schedule
                    </p>
                    <ol className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                      {cohort.schedule.map((date, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          <span className="font-medium text-(--color-primary)">Class {i + 1}:</span>{" "}
                          {formatDate(date)}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Venue */}
                  {cohort.venue_name && (
                    <p className="mt-3 text-sm text-gray-600 flex items-center gap-1">
                      <MapPin size={14} className="text-(--color-accent)" />
                      {cohort.venue_name}
                      {(cohort.venue_address || cohort.venue_city) &&
                        ` — ${[cohort.venue_address, cohort.venue_city].filter(Boolean).join(", ")}`}
                    </p>
                  )}
                </div>

                {/* Members */}
                {expandedId === cohort.id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    {cohort.members.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No mothers enrolled yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mother</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interpreter</th>
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
    </div>
  );
}