-- Custom SQL migration file, put your code below! --
UPDATE "plants"
SET "care" = jsonb_strip_nulls(jsonb_build_object(
    'waterEveryDaysSpring', "seasonal"."water_days",
    'waterEveryDaysSummer', "seasonal"."water_days",
    'waterEveryDaysAutumn', "seasonal"."water_days",
    'waterEveryDaysWinter', "seasonal"."water_days",
    'waterAmountMl', 0,
    'fertilizeEveryDays', "plants"."care" -> 'fertilizeEveryDays',
    'repotEveryMonths', "plants"."care" -> 'repotEveryMonths'
))
FROM (
    SELECT
        "id" AS "plant_id",
        LEAST(GREATEST(("care" ->> 'waterEveryDays')::numeric, 2), 28) AS "water_days"
    FROM "plants"
    WHERE "care" ? 'waterEveryDays'
) AS "seasonal"
WHERE "plants"."id" = "seasonal"."plant_id";
