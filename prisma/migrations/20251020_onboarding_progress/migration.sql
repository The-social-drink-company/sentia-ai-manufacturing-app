-- CreateTable
CREATE TABLE "onboarding_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "completed_steps" JSON NOT NULL DEFAULT '[]',
    "company_data" JSON,
    "integrations_data" JSON,
    "team_data" JSON,
    "import_data" JSON,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_progress_tenant_id_key" ON "onboarding_progress"("tenant_id");

-- CreateIndex
CREATE INDEX "onboarding_progress_is_complete_idx" ON "onboarding_progress"("is_complete");
