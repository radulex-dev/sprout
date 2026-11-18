ALTER TABLE "ai_water_amount" ADD COLUMN "water_percent" integer;--> statement-breakpoint
UPDATE "ai_water_amount" SET "water_percent" = GREATEST(5, LEAST(30, round("water_amount_ml" * 100.0 / "soil_volume_ml")::int));--> statement-breakpoint
DELETE FROM "ai_water_amount" WHERE "id" NOT IN (SELECT DISTINCT ON ("species_key") "id" FROM "ai_water_amount" ORDER BY "species_key", "created_at" DESC);--> statement-breakpoint
ALTER TABLE "ai_water_amount" ALTER COLUMN "water_percent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_water_amount" ADD CONSTRAINT "ai_water_amount_water_percent_check" CHECK ("water_percent" between 5 and 30);--> statement-breakpoint
DROP INDEX "ai_water_amount_lookup_idx";--> statement-breakpoint
ALTER TABLE "ai_water_amount" DROP COLUMN "soil_volume_ml";--> statement-breakpoint
ALTER TABLE "ai_water_amount" DROP COLUMN "water_amount_ml";--> statement-breakpoint
CREATE UNIQUE INDEX "ai_water_amount_species_idx" ON "ai_water_amount" USING btree ("species_key");
