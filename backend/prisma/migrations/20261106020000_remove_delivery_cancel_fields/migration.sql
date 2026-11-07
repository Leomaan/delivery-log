-- Remove any previously canceled rows before dropping the cancel columns
DELETE FROM "Delivery" WHERE "canceledAt" IS NOT NULL;

-- Drop canceledAt and cancelReason from Delivery and enable Cascade delete on Place relations
ALTER TABLE "Delivery" DROP COLUMN IF EXISTS "canceledAt";
ALTER TABLE "Delivery" DROP COLUMN IF EXISTS "cancelReason";

ALTER TABLE "Price" DROP CONSTRAINT IF EXISTS "Price_placeId_fkey";
ALTER TABLE "Price" ADD CONSTRAINT "Price_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Delivery" DROP CONSTRAINT IF EXISTS "Delivery_placeId_fkey";
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
