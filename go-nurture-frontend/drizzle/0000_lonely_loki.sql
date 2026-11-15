CREATE TABLE `cohorts` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`cohort_type` varchar(100) NOT NULL DEFAULT 'birth_confidence',
	`start_date` date NOT NULL,
	`end_date` date,
	`max_participants` int DEFAULT 30,
	`is_active` boolean NOT NULL DEFAULT true,
	`description` text,
	`venue_id` varchar(36),
	`facilitator_id` varchar(36),
	`created_at` datetime(3),
	CONSTRAINT `cohorts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_partners` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3),
	`updated_at` datetime(3),
	CONSTRAINT `community_partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`subject` varchar(255),
	`message` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3),
	CONSTRAINT `contact_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `donations` (
	`id` varchar(36) NOT NULL,
	`amount` double NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'GBP',
	`donor_name` varchar(255),
	`donor_email` varchar(255),
	`payment_provider` varchar(50) NOT NULL DEFAULT 'stripe',
	`payment_intent_id` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`message` text,
	`is_anonymous` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3),
	CONSTRAINT `donations_id` PRIMARY KEY(`id`),
	CONSTRAINT `donations_payment_intent_id_unique` UNIQUE(`payment_intent_id`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` varchar(36) NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text,
	`email_type` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL,
	`error_message` text,
	`created_at` datetime(3),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_queue` (
	`id` varchar(36) NOT NULL,
	`template_key` varchar(100) NOT NULL,
	`recipient_email` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 3,
	`next_attempt_at` datetime(3),
	`last_error` text,
	`sent_at` datetime(3),
	`created_at` datetime(3),
	`updated_at` datetime(3),
	CONSTRAINT `email_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` varchar(36) NOT NULL,
	`template_key` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(255),
	`created_at` datetime(3),
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_email_template_version` UNIQUE(`template_key`,`version`)
);
--> statement-breakpoint
CREATE TABLE `facilitators` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`hashed_password` varchar(255),
	`phone` varchar(50),
	`is_active` boolean NOT NULL DEFAULT true,
	`is_verified` boolean NOT NULL DEFAULT false,
	`set_password_token` varchar(255),
	`set_password_token_expires` datetime(3),
	`created_at` datetime(3),
	`updated_at` datetime(3),
	CONSTRAINT `facilitators_id` PRIMARY KEY(`id`),
	CONSTRAINT `facilitators_email_unique` UNIQUE(`email`),
	CONSTRAINT `facilitators_set_password_token_unique` UNIQUE(`set_password_token`)
);
--> statement-breakpoint
CREATE TABLE `partner_organisations` (
	`id` varchar(36) NOT NULL,
	`organisation_name` varchar(255) NOT NULL,
	`contact_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`hashed_password` varchar(255),
	`phone` varchar(50),
	`organisation_type` varchar(100) NOT NULL DEFAULT 'community',
	`is_active` boolean NOT NULL DEFAULT true,
	`is_verified` boolean NOT NULL DEFAULT false,
	`is_admin` boolean NOT NULL DEFAULT false,
	`set_password_token` varchar(255),
	`set_password_token_expires` datetime(3),
	`created_at` datetime(3),
	`updated_at` datetime(3),
	CONSTRAINT `partner_organisations_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_organisations_email_unique` UNIQUE(`email`),
	CONSTRAINT `partner_organisations_set_password_token_unique` UNIQUE(`set_password_token`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` varchar(36) NOT NULL,
	`partner_id` varchar(36) NOT NULL,
	`mother_name` varchar(255) NOT NULL,
	`mother_phone` varchar(50),
	`mother_email` varchar(255),
	`estimated_due_date` date,
	`reference_number` varchar(32),
	`referrer_name` varchar(255),
	`referrer_email` varchar(255),
	`referrer_phone` varchar(50),
	`preferred_name` varchar(255),
	`safe_contact_method` varchar(20),
	`voicemail_ok` varchar(20),
	`communication_restrictions` text,
	`locality` varchar(255),
	`postcode_area` varchar(20),
	`gestation_info` varchar(100),
	`can_attend_course` varchar(20),
	`timing_notes` text,
	`baby_born` varchar(20),
	`baby_age_or_due` varchar(100),
	`preferred_appointment_timing` varchar(255),
	`barriers` json,
	`barriers_other` varchar(255),
	`interpreter_support` varchar(20),
	`adjustments_needed` text,
	`referral_type` varchar(100) NOT NULL DEFAULT 'birth_confidence',
	`language_requirement` varchar(255),
	`additional_notes` text,
	`requires_interpreter` boolean NOT NULL DEFAULT false,
	`consent_obtained` boolean NOT NULL DEFAULT false,
	`cohort_id` varchar(36),
	`clinic_cohort_id` varchar(36),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`created_at` datetime(3),
	`updated_at` datetime(3),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_reference_number_unique` UNIQUE(`reference_number`)
);
--> statement-breakpoint
CREATE TABLE `session_reviews` (
	`id` varchar(36) NOT NULL,
	`cohort_id` varchar(36) NOT NULL,
	`facilitator_id` varchar(36) NOT NULL,
	`session_date` datetime(3) NOT NULL,
	`week_number` int,
	`mode` varchar(50),
	`venue_or_platform` varchar(255),
	`lead_facilitator` varchar(255),
	`co_facilitator` varchar(255),
	`start_time` varchar(50),
	`finish_time` varchar(50),
	`registered_count` int,
	`attended_count` int,
	`supporter_count` int,
	`reasonable_adjustments` text,
	`fidelity_checked` json,
	`quality_ratings` json,
	`deviations` text,
	`incidents` json,
	`reflection` json,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`submitted_at` datetime(3),
	`created_at` datetime(3),
	`updated_at` datetime(3),
	CONSTRAINT `session_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(500) NOT NULL,
	`city` varchar(100) NOT NULL,
	`postcode` varchar(20),
	`capacity` int,
	`latitude` double,
	`longitude` double,
	`description` text,
	`transport_links` text,
	`nearby_landmarks` text,
	`accessibility_info` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3),
	CONSTRAINT `venues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cohorts` ADD CONSTRAINT `cohorts_venue_id_venues_id_fk` FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cohorts` ADD CONSTRAINT `cohorts_facilitator_id_facilitators_id_fk` FOREIGN KEY (`facilitator_id`) REFERENCES `facilitators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_partner_id_partner_organisations_id_fk` FOREIGN KEY (`partner_id`) REFERENCES `partner_organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_cohort_id_cohorts_id_fk` FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_clinic_cohort_id_cohorts_id_fk` FOREIGN KEY (`clinic_cohort_id`) REFERENCES `cohorts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_reviews` ADD CONSTRAINT `session_reviews_cohort_id_cohorts_id_fk` FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_reviews` ADD CONSTRAINT `session_reviews_facilitator_id_facilitators_id_fk` FOREIGN KEY (`facilitator_id`) REFERENCES `facilitators`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ix_email_queue_status` ON `email_queue` (`status`);--> statement-breakpoint
CREATE INDEX `ix_referrals_partner` ON `referrals` (`partner_id`);--> statement-breakpoint
CREATE INDEX `ix_referrals_status` ON `referrals` (`status`);