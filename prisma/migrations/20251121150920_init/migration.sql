-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ownerCarIds" TEXT
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dailyRate" REAL NOT NULL,
    "image" TEXT NOT NULL,
    "ownerId" TEXT,
    CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "garageName" TEXT NOT NULL,
    "partsReplaced" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    CONSTRAINT "ServiceRecord_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "pickupFee" REAL,
    "deliveryFee" REAL,
    "totalAmount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Booking_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Car_plate_key" ON "Car"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");
