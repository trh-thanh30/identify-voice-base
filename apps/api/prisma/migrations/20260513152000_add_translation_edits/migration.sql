ALTER TABLE "translation_records"
ADD COLUMN "edited_translated_text" TEXT,
ADD COLUMN "edited_at" TIMESTAMP(3),
ADD COLUMN "edited_by" UUID;

CREATE INDEX "translation_records_edited_by_idx" ON "translation_records"("edited_by");

ALTER TABLE "translation_records"
ADD CONSTRAINT "translation_records_edited_by_fkey"
FOREIGN KEY ("edited_by") REFERENCES "auth_accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
