-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "active_status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_records" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cccd" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identify_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_type" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "results" JSONB,
    "identified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identify_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_username_key" ON "auth_accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "voice_records_cccd_key" ON "voice_records"("cccd");
