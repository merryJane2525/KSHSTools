-- CreateTable
CREATE TABLE "OperatorEquipment" (
    "operatorId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorEquipment_pkey" PRIMARY KEY ("operatorId","equipmentId")
);

-- CreateIndex
CREATE INDEX "OperatorEquipment_equipmentId_idx" ON "OperatorEquipment"("equipmentId");

-- AddForeignKey
ALTER TABLE "OperatorEquipment" ADD CONSTRAINT "OperatorEquipment_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorEquipment" ADD CONSTRAINT "OperatorEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
