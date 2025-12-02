-- CreateTable
CREATE TABLE "work_item_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "serviceOrderId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_item_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_item_notes_projectId_key" ON "work_item_notes"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "work_item_notes_serviceOrderId_key" ON "work_item_notes"("serviceOrderId");

-- CreateIndex
CREATE INDEX "work_item_notes_userId_idx" ON "work_item_notes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "work_item_notes_userId_projectId_key" ON "work_item_notes"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "work_item_notes_userId_serviceOrderId_key" ON "work_item_notes"("userId", "serviceOrderId");

-- AddForeignKey
ALTER TABLE "work_item_notes" ADD CONSTRAINT "work_item_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_notes" ADD CONSTRAINT "work_item_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_notes" ADD CONSTRAINT "work_item_notes_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
