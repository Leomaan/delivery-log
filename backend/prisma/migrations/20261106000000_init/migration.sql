-- CreateTable
CREATE TABLE "Place" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" SERIAL NOT NULL,
    "placeId" INTEGER NOT NULL,
    "unitCents" INTEGER NOT NULL,
    "validFrom" DATE NOT NULL,
    "validTo" DATE,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Price_unitCents_check" CHECK ("unitCents" > 0),
    CONSTRAINT "Price_valid_range_check" CHECK ("validTo" IS NULL OR "validTo" >= "validFrom")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" SERIAL NOT NULL,
    "placeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Delivery_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "Delivery_unitCents_check" CHECK ("unitCents" > 0),
    CONSTRAINT "Delivery_totalCents_check" CHECK ("totalCents" = "quantity" * "unitCents")
);

-- CreateIndex
CREATE INDEX "Price_placeId_validFrom_idx" ON "Price"("placeId", "validFrom");

-- CreateIndex
CREATE INDEX "Delivery_placeId_date_idx" ON "Delivery"("placeId", "date");

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
