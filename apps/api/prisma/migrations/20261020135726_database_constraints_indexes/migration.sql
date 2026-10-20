-- CreateIndex
CREATE INDEX "location_services_service_id_idx" ON "location_services"("service_id");

-- CreateIndex
CREATE INDEX "order_files_order_id_idx" ON "order_files"("order_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_order_type_created_at_idx" ON "orders"("order_type", "created_at");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_location_id_idx" ON "orders"("location_id");

-- CreateIndex
CREATE INDEX "products_category_id_availability_idx" ON "products"("category_id", "availability");

-- CreateIndex
CREATE INDEX "services_category_id_idx" ON "services"("category_id");

-- ---------------------------------------------------------------------------
-- Custom SQL (TASK-01.06). Prisma schema cannot express CHECK constraints or
-- expression indexes, so they are written by hand here. Row-level invariants
-- only: no triggers, no cross-table or workflow rules (those belong to the
-- service layer).
-- ---------------------------------------------------------------------------

-- KI-008: case-insensitive email uniqueness (defense in depth; the
-- application still trims + lowercases emails before storing them).
CREATE UNIQUE INDEX "users_email_lower_key" ON "users"(lower("email"));

-- Catalog: integer Rupiah prices are never negative; FIXED services need a
-- price (REQUIRES_CONFIRMATION may have none or an indicative one).
ALTER TABLE "services" ADD CONSTRAINT "services_price_non_negative" CHECK ("price" IS NULL OR "price" >= 0);
ALTER TABLE "services" ADD CONSTRAINT "services_fixed_price_required" CHECK ("price_type" <> 'FIXED' OR "price" IS NOT NULL);
ALTER TABLE "products" ADD CONSTRAINT "products_price_non_negative" CHECK ("price" >= 0);

-- Orders: money never negative.
ALTER TABLE "orders" ADD CONSTRAINT "orders_estimated_total_non_negative" CHECK ("estimated_total" IS NULL OR "estimated_total" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_final_total_non_negative" CHECK ("final_total" IS NULL OR "final_total" >= 0);

-- Order items: positive quantity, non-negative money, and at most one live
-- catalog link (both null = custom item).
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_snapshot_non_negative" CHECK ("unit_price_snapshot" IS NULL OR "unit_price_snapshot" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_subtotal_non_negative" CHECK ("subtotal" IS NULL OR "subtotal" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_single_catalog_ref" CHECK (NOT ("product_id" IS NOT NULL AND "service_id" IS NOT NULL));

-- Laptop service: non-negative distance and fee; PICKUP needs an address
-- containing at least one non-whitespace character.
ALTER TABLE "laptop_service_requests" ADD CONSTRAINT "laptop_service_requests_distance_km_non_negative" CHECK ("distance_km" IS NULL OR "distance_km" >= 0);
ALTER TABLE "laptop_service_requests" ADD CONSTRAINT "laptop_service_requests_pickup_fee_non_negative" CHECK ("pickup_fee" IS NULL OR "pickup_fee" >= 0);
ALTER TABLE "laptop_service_requests" ADD CONSTRAINT "laptop_service_requests_pickup_address_required" CHECK ("handover_method" <> 'PICKUP' OR ("pickup_address" IS NOT NULL AND "pickup_address" ~ '[^[:space:]]'));

-- Payments: amount never negative (status/confirmation workflow is not
-- encoded here).
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amount" IS NULL OR "amount" >= 0);

-- Order files: a stored file has at least one byte.
ALTER TABLE "order_files" ADD CONSTRAINT "order_files_size_bytes_positive" CHECK ("size_bytes" > 0);

-- Business settings: singleton row.
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_singleton" CHECK ("id" = 1);
