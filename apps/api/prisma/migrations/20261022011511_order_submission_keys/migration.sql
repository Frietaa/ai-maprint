-- TASK-06.05 (KI-020): duplicate-submission protection for POST /orders.
-- Additive infrastructure table only; no existing table or row changes.
-- Holds SHA-256 hashes of client Idempotency-Keys and requests, never the
-- raw key or request contents.

-- CreateTable
CREATE TABLE "order_submission_keys" (
    "key_hash" CHAR(64) NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID,
    "request_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_submission_keys_pkey" PRIMARY KEY ("key_hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_submission_keys_order_id_key" ON "order_submission_keys"("order_id");

-- CreateIndex
CREATE INDEX "order_submission_keys_created_at_idx" ON "order_submission_keys"("created_at");

-- CreateIndex
CREATE INDEX "order_submission_keys_user_id_idx" ON "order_submission_keys"("user_id");

-- AddForeignKey
ALTER TABLE "order_submission_keys" ADD CONSTRAINT "order_submission_keys_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_submission_keys" ADD CONSTRAINT "order_submission_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hashes are lowercase hex SHA-256 digests.
ALTER TABLE "order_submission_keys" ADD CONSTRAINT "order_submission_keys_key_hash_hex" CHECK ("key_hash" ~ '^[0-9a-f]{64}$');
ALTER TABLE "order_submission_keys" ADD CONSTRAINT "order_submission_keys_request_hash_hex" CHECK ("request_hash" ~ '^[0-9a-f]{64}$');
