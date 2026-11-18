CREATE TABLE "ai_care_interval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"species_key" text NOT NULL,
	"water_spring" integer NOT NULL,
	"water_summer" integer NOT NULL,
	"water_autumn" integer NOT NULL,
	"water_winter" integer NOT NULL,
	"fertilize_every_days" integer,
	"repot_every_months" integer,
	"confidence" text NOT NULL,
	"model" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"day" integer NOT NULL,
	"calls" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_water_amount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"species_key" text NOT NULL,
	"water_percent" integer NOT NULL,
	"model" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "ai_water_amount_water_percent_check" CHECK ("water_percent" between 5 and 30)
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_care_interval_species_idx" ON "ai_care_interval" USING btree ("species_key");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_usage_user_day_idx" ON "ai_usage" USING btree ("user_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_water_amount_species_idx" ON "ai_water_amount" USING btree ("species_key");--> statement-breakpoint
DROP TABLE "care_reference";
