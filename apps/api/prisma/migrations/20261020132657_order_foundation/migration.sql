-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('PRINTING', 'ATK', 'LAPTOP_SERVICE', 'SOFTWARE_INSTALLATION');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('SUBMITTED', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "handover_method" AS ENUM ('DROP_OFF', 'PICKUP');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "public_id" VARCHAR(32) NOT NULL,
    "user_id" UUID,
    "location_id" UUID,
    "order_type" "order_type" NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_whatsapp" TEXT NOT NULL,
    "customer_email" TEXT,
    "description" TEXT,
    "requested_completion_at" TIMESTAMPTZ(3),
    "status" "order_status" NOT NULL DEFAULT 'SUBMITTED',
    "estimated_total" INTEGER,
    "final_total" INTEGER,
    "admin_notes" TEXT,
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "service_id" UUID,
    "name_snapshot" TEXT NOT NULL,
    "description_snapshot" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price_snapshot" INTEGER,
    "subtotal" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laptop_service_requests" (
    "order_id" UUID NOT NULL,
    "complaint" TEXT NOT NULL,
    "handover_at" TIMESTAMPTZ(3),
    "handover_method" "handover_method" NOT NULL,
    "pickup_address" TEXT,
    "distance_km" DECIMAL(6,2),
    "pickup_fee" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laptop_service_requests_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "software_installation_requests" (
    "order_id" UUID NOT NULL,
    "software_name" TEXT NOT NULL,
    "requirements" TEXT,
    "license_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "software_installation_requests_pkey" PRIMARY KEY ("order_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_public_id_key" ON "orders"("public_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laptop_service_requests" ADD CONSTRAINT "laptop_service_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installation_requests" ADD CONSTRAINT "software_installation_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
