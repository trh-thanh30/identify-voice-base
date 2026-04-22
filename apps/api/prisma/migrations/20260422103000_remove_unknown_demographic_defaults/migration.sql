-- Unknown demographics must be stored as NULL, not fallback values.
ALTER TABLE "users" ALTER COLUMN "age" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "gender" DROP DEFAULT;

UPDATE "users"
SET "age" = NULL
WHERE "age" = 0;

UPDATE "users"
SET "gender" = NULL
WHERE "gender" = 'OTHER';
