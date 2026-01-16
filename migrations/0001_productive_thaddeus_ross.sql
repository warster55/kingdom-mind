CREATE TABLE "mentor_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"curriculum_adherence" integer,
	"empathy_appropriateness" integer,
	"breakthrough_detection" integer,
	"domain_accuracy" integer,
	"response_structure" integer,
	"theological_soundness" integer,
	"overall_score" integer,
	"observations" text,
	"tool_usage" jsonb,
	"message_count" integer,
	"model_used" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webauthn_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" varchar(50),
	"backed_up" boolean DEFAULT false,
	"transports" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_method" varchar(20) DEFAULT 'totp' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_enabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "seed_phrase_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "encrypted_user_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "seed_phrase_created_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_set_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_activity_at" timestamp;--> statement-breakpoint
ALTER TABLE "mentor_reviews" ADD CONSTRAINT "mentor_reviews_session_id_mentoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentoring_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_reviews_session_id_idx" ON "mentor_reviews" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mentor_reviews_overall_score_idx" ON "mentor_reviews" USING btree ("overall_score");--> statement-breakpoint
CREATE INDEX "webauthn_user_id_idx" ON "webauthn_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webauthn_credential_id_idx" ON "webauthn_credentials" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");