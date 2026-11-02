-- AlterTable: correlation ids are opaque strings (trace ids are not always UUIDs).
ALTER TABLE "search_audit"
  ALTER COLUMN "correlation_id" SET DATA TYPE VARCHAR(128) USING "correlation_id"::text;
