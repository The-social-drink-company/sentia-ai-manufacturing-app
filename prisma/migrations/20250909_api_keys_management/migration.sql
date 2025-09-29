-- CreateTable for API Key Management
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL DEFAULT 'default',
    "service" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "value" TEXT,
    "encryptedData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_organizationId_service_keyName_key" ON "ApiKey"("organizationId", "service", "keyName");

-- CreateTable for API Connection Status
CREATE TABLE IF NOT EXISTS "ApiConnectionStatus" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL DEFAULT 'default', 
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER,
    "errorMessage" TEXT,
    "metadata" JSONB,
    
    CONSTRAINT "ApiConnectionStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiConnectionStatus_organizationId_service_key" ON "ApiConnectionStatus"("organizationId", "service");

-- CreateTable for API Usage Logs
CREATE TABLE IF NOT EXISTS "ApiUsageLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL DEFAULT 'default',
    "service" TEXT NOT NULL,
    "endpoint" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "metadata" JSONB,
    
    CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiUsageLog_organizationId_service_timestamp_idx" ON "ApiUsageLog"("organizationId", "service", "timestamp");
CREATE INDEX "ApiUsageLog_timestamp_idx" ON "ApiUsageLog"("timestamp");

-- Update existing users table if it exists to support organization context
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organizationId') THEN
        ALTER TABLE "users" ADD COLUMN "organizationId" TEXT DEFAULT 'default';
    END IF;
END $$;