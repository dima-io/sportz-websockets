CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished');--> statement-breakpoint
CREATE TABLE "commentary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"minute" integer,
	"sequence" integer NOT NULL,
	"period" varchar(50),
	"event_type" varchar(100) NOT NULL,
	"actor" varchar(255),
	"team" varchar(255),
	"message" varchar(1000),
	"metadata" jsonb,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sport" varchar(100) NOT NULL,
	"home_team" varchar(255) NOT NULL,
	"away_team" varchar(255) NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;