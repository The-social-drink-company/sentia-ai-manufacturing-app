-- CreateTable
CREATE TABLE "public"."invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "token" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "public"."invitations"("token");

-- CreateIndex
CREATE INDEX "idx_invitations_token" ON "public"."invitations"("token");

-- CreateIndex
CREATE INDEX "idx_invitations_email_tenant" ON "public"."invitations"("email", "tenant_id");

-- CreateIndex
CREATE INDEX "idx_invitations_tenant" ON "public"."invitations"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_invitations_expires" ON "public"."invitations"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
