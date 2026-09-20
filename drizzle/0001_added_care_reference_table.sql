CREATE TABLE "care_reference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_type" text NOT NULL,
	"match_key" text NOT NULL,
	"alias_target" text,
	"water_interval" integer,
	"water_unit" text,
	"fertilize_interval" integer,
	"fertilize_unit" text,
	"repot_interval" integer,
	"repot_unit" text,
	"family" text,
	"source_url" text,
	CONSTRAINT "care_reference_water_range" CHECK (("care_reference"."water_interval" is null and "care_reference"."water_unit" is null) or ("care_reference"."water_interval" is not null and "care_reference"."water_unit" is not null and "care_reference"."water_unit" in ('D', 'M', 'Y') and "care_reference"."water_interval" * case "care_reference"."water_unit" when 'D' then 1 when 'M' then 30 else 365 end between 2 and 28)),
	CONSTRAINT "care_reference_fertilize_range" CHECK (("care_reference"."fertilize_interval" is null and "care_reference"."fertilize_unit" is null) or ("care_reference"."fertilize_interval" is not null and "care_reference"."fertilize_unit" is not null and "care_reference"."fertilize_unit" in ('D', 'M', 'Y') and "care_reference"."fertilize_interval" * case "care_reference"."fertilize_unit" when 'D' then 1 when 'M' then 30 else 365 end between 14 and 90)),
	CONSTRAINT "care_reference_repot_range" CHECK (("care_reference"."repot_interval" is null and "care_reference"."repot_unit" is null) or ("care_reference"."repot_interval" is not null and "care_reference"."repot_unit" is not null and "care_reference"."repot_unit" in ('D', 'M', 'Y') and "care_reference"."repot_interval" * case "care_reference"."repot_unit" when 'D' then 1 when 'M' then 30 else 365 end between 180 and 1095))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "care_reference_match_idx" ON "care_reference" USING btree ("match_type","match_key");