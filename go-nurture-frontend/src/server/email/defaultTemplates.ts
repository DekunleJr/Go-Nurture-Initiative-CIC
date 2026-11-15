// Generated from the original Jinja templates. Seeded into the email_templates table on first run;
// admins can then edit them in the dashboard.
export interface DefaultTemplate {
  key: string;
  name: string;
  subject: string;
  body: string;
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    key: "partner_invite",
    name: "Partner invitation",
    subject: "You've been invited to join {{ organisation_name }} on Go Nurture Initiative",
    body: "Hello {{ recipient_name }},\n\nYou have been registered as a partner organisation for Go Nurture Initiative CIC.\n\nTo access the Partner Portal and start submitting referrals, please set your password using the link below:\n\n{{ invite_link }}\n\nThis link will expire in 48 hours.\n\nIf you have any questions, please contact the Go Nurture team.\n\nBest regards,\nGo Nurture Initiative CIC\n",
  },
  {
    key: "password_reset",
    name: "Password reset",
    subject: "Reset your Go Nurture Initiative password",
    body: "Hello {{ recipient_name }},\n\nWe received a request to reset your password for the Go Nurture Initiative Partner Portal.\n\nTo choose a new password, please use the link below:\n\n{{ reset_link }}\n\nThis link will expire in 48 hours.\n\nIf you did not request this, you can safely ignore this email. Your password will remain unchanged.\n\nBest regards,\nGo Nurture Initiative CIC\n",
  },
  {
    key: "referral_notification",
    name: "New referral notification",
    subject: "[New Referral] A new mother needs approval",
    body: "A new referral has been submitted and requires your attention.\n\n- Reference: {{ reference_number or \"Not available\" }}\n- Service requested: {{ program_name }}\n- Referring organisation: {{ partner_name }}\n- Interpretation or communication support: {{ interpreter_support or \"Not stated\" }}\n\nPersonal details are not included in this email. Please review and approve/reject this referral in the admin dashboard.",
  },
  {
    key: "donation_notification",
    name: "Donation notification",
    subject: "[New Donation] A new donation has been received",
    body: "A new donation has been received.\n\nDonor Details:\n- Name: {{ donor_name or \"Anonymous\" }}\n- Email: {{ donor_email or \"N/A\" }}\n- Amount: {{ amount }} {{ currency }}\n- Message: {{ message or \"No message\" }}\n\nPlease review the donation in the admin dashboard.",
  },
  {
    key: "referral_approval",
    name: "Referral approval",
    subject: "[Referral Approved] {{ mother_name }}'s referral has been approved",
    body: "Hello {{ partner_name }},\n\nGood news! A referral you submitted has been approved by the admin team.\n\nReferral Details:\n- Mother: {{ mother_name }}\n- Estimated Due Date: {{ due_date }}\n- Language Requirement: {{ language_requirement or \"None specified\" }}\n- Requires Interpreter: {{ \"Yes\" if requires_interpreter else \"No\" }}\n\nApproved Cohort: {{ cohort_name or \"Not assigned yet\" }}\nVenue: {{ venue_name or \"Not assigned yet\" }}\n\nAdditional Notes:\n{{ additional_notes or \"None\" }}\n\nBest regards,\nGo Nurture Initiative CIC",
  },
  {
    key: "contact",
    name: "Contact form notification",
    subject: "[Contact Form] {{ message_subject }}",
    body: "You have received a new message from the Go Nurture Initiative website contact form.\n\nSender: {{ sender_name }}\nEmail: {{ sender_email }}\nSubject: {{ message_subject }}\n\nMessage:\n{{ message }}\n\nThis email was sent automatically from the Go Nurture website contact form.",
  },
  {
    key: "facilitator_assignment",
    name: "Facilitator assignment",
    subject: "You've been assigned: {{ cohort_name }}",
    body: "Hello {{ facilitator_name }},\n\nYou have been assigned as the facilitator for the following {{ \"session\" if is_clinic else \"cohort\" }}:\n\nProgramme: {{ program_name }}\nGroup: {{ cohort_name }}\n{% if is_clinic %}Date: {{ date_text }}\n{% else %}Class Schedule (weekly):\n{{ schedule_lines }}\n{% endif %}{{ venue_line }}\n\nPlease log into your facilitator portal to view enrolled participants and submit your delivery audit.\n\nBest regards,\nGo Nurture Initiative CIC",
  },
  {
    key: "cohort_assignment_mother",
    name: "Cohort assignment to mother",
    subject: "Your Go Nurture programme booking",
    body: "Dear {{ mother_name }},\n\nWonderful news! You have been booked into the {{ program_name }}.\n\nGroup: {{ cohort_name }}\n{% if is_clinic %}Appointment date: {{ date_text }}\n{% else %}Class schedule (weekly):\n{{ schedule_lines }}\n{% endif %}{{ venue_block }}\n\nIf anything changes, please contact the Go Nurture team so we can support you.\n\nWith warmth,\nThe Go Nurture Initiative Team",
  },
  {
    key: "cohort_assignment_partner",
    name: "Cohort assignment to partner",
    subject: "[Cohort Assigned] {{ mother_name }}",
    body: "Hello {{ partner_name }},\n\nGood news! The mother you referred has been assigned to a programme.\n\nReferral Details:\n- Mother: {{ mother_name }}\n- Mother's Email: {{ mother_email or \"Not provided\" }}\n- Programme: {{ program_name }}\n- Group: {{ cohort_name }}\n{% if is_clinic %}- Appointment Date: {{ date_text }}\n{% else %}Class Schedule (weekly):\n{{ schedule_lines }}\n{% endif %}- Venue: {{ venue_name or \"To be confirmed\" }}\n\nThe mother has been notified directly.\n\nThank you for your continued partnership.\n\nBest regards,\nGo Nurture Initiative CIC",
  },
];
