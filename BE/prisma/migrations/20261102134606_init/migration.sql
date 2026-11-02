-- CreateTable
CREATE TABLE "search_audit" (
    "id" UUID NOT NULL,
    "correlation_id" UUID NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "sales_status" VARCHAR(20) NOT NULL,
    "service_status" VARCHAR(20) NOT NULL,
    "sales_latency_ms" INTEGER NOT NULL,
    "service_latency_ms" INTEGER NOT NULL,
    "document_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_search_audit_vin_created" ON "search_audit"("vin", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_search_audit_correlation" ON "search_audit"("correlation_id");
