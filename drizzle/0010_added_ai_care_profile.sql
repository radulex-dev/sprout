CREATE TABLE "ai_care_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"species_key" text NOT NULL,
	"soil_volume_ml" integer NOT NULL,
	"water_spring" integer NOT NULL,
	"water_summer" integer NOT NULL,
	"water_autumn" integer NOT NULL,
	"water_winter" integer NOT NULL,
	"water_amount_ml" integer NOT NULL,
	"fertilize_every_days" integer,
	"repot_every_months" integer,
	"confidence" text NOT NULL,
	"model" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_care_profile_lookup_idx" ON "ai_care_profile" USING btree ("species_key","soil_volume_ml");