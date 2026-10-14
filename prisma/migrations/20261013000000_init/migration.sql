-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Device" AS ENUM ('iphone', 'windows');

-- CreateEnum
CREATE TYPE "WalkthroughStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "HighlightType" AS ENUM ('box', 'arrow');

-- CreateEnum
CREATE TYPE "ArrowDirection" AS ENUM ('up', 'down', 'left', 'right');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access_code" TEXT NOT NULL,
    "enabled_devices" "Device"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "walkthroughs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "device" "Device" NOT NULL,
    "os_versions" TEXT[],
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "synonyms" TEXT[],
    "bonus_tip" TEXT,
    "status" "WalkthroughStatus" NOT NULL DEFAULT 'draft',
    "verified_by" TEXT,
    "verified_on" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "walkthroughs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "steps" (
    "id" TEXT NOT NULL,
    "walkthrough_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "image_key" TEXT NOT NULL,
    "image_is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "highlight_type" "HighlightType",
    "highlight_x" DOUBLE PRECISION,
    "highlight_y" DOUBLE PRECISION,
    "highlight_w" DOUBLE PRECISION,
    "highlight_h" DOUBLE PRECISION,
    "highlight_direction" "ArrowDirection",

    CONSTRAINT "steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hidden_walkthroughs" (
    "organization_id" TEXT NOT NULL,
    "walkthrough_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hidden_walkthroughs_pkey" PRIMARY KEY ("organization_id","walkthrough_id")
);

-- CreateTable
CREATE TABLE "query_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "matched_walkthrough_id" TEXT,
    "confidence" DOUBLE PRECISION,
    "solved" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_access_code_key" ON "organizations"("access_code");

-- CreateIndex
CREATE INDEX "walkthroughs_device_status_idx" ON "walkthroughs"("device", "status");

-- CreateIndex
CREATE UNIQUE INDEX "walkthroughs_organization_id_slug_key" ON "walkthroughs"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "steps_organization_id_idx" ON "steps"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "steps_walkthrough_id_order_key" ON "steps"("walkthrough_id", "order");

-- CreateIndex
CREATE INDEX "query_logs_organization_id_created_at_idx" ON "query_logs"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "walkthroughs" ADD CONSTRAINT "walkthroughs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "steps_walkthrough_id_fkey" FOREIGN KEY ("walkthrough_id") REFERENCES "walkthroughs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "steps" ADD CONSTRAINT "steps_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_walkthroughs" ADD CONSTRAINT "hidden_walkthroughs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_walkthroughs" ADD CONSTRAINT "hidden_walkthroughs_walkthrough_id_fkey" FOREIGN KEY ("walkthrough_id") REFERENCES "walkthroughs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_logs" ADD CONSTRAINT "query_logs_matched_walkthrough_id_fkey" FOREIGN KEY ("matched_walkthrough_id") REFERENCES "walkthroughs"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Global library slugs must be unique. The composite (organization_id, slug)
-- index above does not cover them because Postgres treats NULLs as distinct.
CREATE UNIQUE INDEX "walkthroughs_global_slug_key" ON "walkthroughs"("slug") WHERE "organization_id" IS NULL;