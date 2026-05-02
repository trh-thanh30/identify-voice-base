-- CreateEnum
CREATE TYPE "TranslationMode" AS ENUM ('TRANSLATE', 'SUMMARIZE');

-- CreateTable
CREATE TABLE "translation_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source_text" TEXT NOT NULL,
    "translated_text" TEXT NOT NULL,
    "source_lang" TEXT,
    "target_lang" TEXT NOT NULL,
    "mode" "TranslationMode" NOT NULL DEFAULT 'TRANSLATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translation_records_user_id_idx" ON "translation_records"("user_id");

-- CreateIndex
CREATE INDEX "translation_records_created_at_idx" ON "translation_records"("created_at");

-- CreateIndex
CREATE INDEX "translation_records_target_lang_idx" ON "translation_records"("target_lang");

-- CreateIndex
CREATE INDEX "translation_records_mode_idx" ON "translation_records"("mode");

-- AddForeignKey
ALTER TABLE "translation_records" ADD CONSTRAINT "translation_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
