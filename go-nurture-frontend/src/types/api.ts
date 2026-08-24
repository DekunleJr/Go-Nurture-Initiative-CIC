/**
 * Centralized API response types
 * Used across frontend for type safety and consistency
 */

export interface Stats {
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

export interface Referral {
  id: string;
  mother_name: string;
  mother_phone: string;
  mother_email: string | null;
  estimated_due_date: string;
  referral_type?: string;
  language_requirement: string | null;
  requires_interpreter: boolean;
  status: string;
  partner_id: string;
  partner_name: string | null;
  cohort_id: string | null;
  clinic_cohort_name?: string | null;
  cohort_name: string | null;
  venue_name: string | null;
  created_at: string;
}

export interface Partner {
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

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string | null;
  capacity: number;
  description: string;
  transport_links: string;
  nearby_landmarks: string;
  latitude: number | null;
  longitude: number | null;
}

export interface CohortMember {
  id: string;
  mother_name: string;
  mother_phone: string;
  estimated_due_date: string | null;
  status: string;
  language_requirement: string | null;
  requires_interpreter: boolean;
  created_at: string | null;
}

export interface Cohort {
  id: string;
  name: string;
  year: number;
  cohort_type: string;
  start_date: string;
  end_date: string | null;
  max_participants: number;
  venue_name: string;
  venue_id: string | null;
  venue_address: string | null;
  venue_city: string | null;
  members: CohortMember[];
}

export interface Donation {
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

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

export interface CommunityPartner {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Facilitator {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface SessionReview {
  id: string;
  cohort_id: string;
  facilitator_id: string;
  session_date: string;
  week_number: number | null;
  mode: string | null;
  venue_or_platform: string | null;
  lead_facilitator: string | null;
  co_facilitator: string | null;
  start_time: string | null;
  finish_time: string | null;
  registered_count: number | null;
  attended_count: number | null;
  supporter_count: number | null;
  reasonable_adjustments: string | null;
  fidelity_checked: string[] | null;
  quality_ratings: Record<string, { score: number; comment: string }> | null;
  deviations: string | null;
  incidents: Array<Record<string, string>> | null;
  reflection: Record<string, string> | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  cohort_name: string | null;
  facilitator_name: string | null;
}

export interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  body: string;
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface EmailQueueItem {
  id: string;
  template_key: string;
  recipient_email: string;
  subject: string;
  status: string;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string | null;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
}
