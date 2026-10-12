UPDATE "plants" SET "care" = "care" - 'fertilizeEveryDays' WHERE "care"->>'fertilizeEveryDays' = '0';

UPDATE "plants" SET "care" = "care" - 'repotEveryMonths' WHERE "care"->>'repotEveryMonths' = '0';
