CREATE TABLE "app_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"telemetry" jsonb,
	"sentiment" jsonb,
	"cost_metadata" jsonb,
	"x_pos" integer,
	"y_pos" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(50) NOT NULL,
	"pillar_name" varchar(100) NOT NULL,
	"pillar_order" integer NOT NULL,
	"description" text NOT NULL,
	"key_truth" text NOT NULL,
	"core_verse" text
);
--> statement-breakpoint
CREATE TABLE "greetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"domain" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"frequency" varchar(20) DEFAULT 'daily',
	"streak" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_id" integer,
	"domain" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"importance" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_number" integer NOT NULL,
	"topic" varchar(255),
	"status" varchar(20) DEFAULT 'active',
	"started_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sacred_pillars" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"order" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"content" text NOT NULL,
	"change_log" text,
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thoughts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"curriculum_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'locked' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"current_domain" text DEFAULT 'Identity' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"resonance_identity" integer DEFAULT 0 NOT NULL,
	"resonance_purpose" integer DEFAULT 0 NOT NULL,
	"resonance_mindset" integer DEFAULT 0 NOT NULL,
	"resonance_relationships" integer DEFAULT 0 NOT NULL,
	"resonance_vision" integer DEFAULT 0 NOT NULL,
	"resonance_action" integer DEFAULT 0 NOT NULL,
	"resonance_legacy" integer DEFAULT 0 NOT NULL,
	"onboarding_stage" integer DEFAULT 0 NOT NULL,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"last_bread_at" timestamp,
	"current_bread_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_mentoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentoring_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_events" ADD CONSTRAINT "client_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_session_id_mentoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentoring_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_sessions" ADD CONSTRAINT "mentoring_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thoughts" ADD CONSTRAINT "thoughts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_curriculum_id_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculum"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_current_bread_id_curriculum_id_fk" FOREIGN KEY ("current_bread_id") REFERENCES "public"."curriculum"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_progress_user_id_idx" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");