-- CreateTable
CREATE TABLE "transformers" (
    "id" TEXT NOT NULL,
    "transformerName" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "substation" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "voltageRating" TEXT NOT NULL,
    "mvaRating" TEXT NOT NULL,
    "commissioningDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transformers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dga_samples" (
    "id" TEXT NOT NULL,
    "transformerId" TEXT NOT NULL,
    "sampleDate" DATE NOT NULL,
    "h2" DOUBLE PRECISION NOT NULL,
    "ch4" DOUBLE PRECISION NOT NULL,
    "c2h6" DOUBLE PRECISION NOT NULL,
    "c2h4" DOUBLE PRECISION NOT NULL,
    "c2h2" DOUBLE PRECISION NOT NULL,
    "co" DOUBLE PRECISION NOT NULL,
    "co2" DOUBLE PRECISION NOT NULL,
    "o2" DOUBLE PRECISION,
    "n2" DOUBLE PRECISION,
    "remarks" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dga_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" TEXT NOT NULL,
    "transformerId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "normProfile" TEXT NOT NULL,
    "o2n2Ratio" DOUBLE PRECISION,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delta_results" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "h2Delta" DOUBLE PRECISION,
    "ch4Delta" DOUBLE PRECISION,
    "c2h6Delta" DOUBLE PRECISION,
    "c2h4Delta" DOUBLE PRECISION,
    "c2h2Delta" DOUBLE PRECISION,
    "coDelta" DOUBLE PRECISION,
    "co2Delta" DOUBLE PRECISION,

    CONSTRAINT "delta_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dga_samples_transformerId_idx" ON "dga_samples"("transformerId");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_results_sampleId_key" ON "analysis_results"("sampleId");

-- CreateIndex
CREATE INDEX "analysis_results_transformerId_idx" ON "analysis_results"("transformerId");

-- CreateIndex
CREATE UNIQUE INDEX "delta_results_analysisId_key" ON "delta_results"("analysisId");

-- AddForeignKey
ALTER TABLE "dga_samples" ADD CONSTRAINT "dga_samples_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "transformers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_transformerId_fkey" FOREIGN KEY ("transformerId") REFERENCES "transformers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "dga_samples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delta_results" ADD CONSTRAINT "delta_results_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analysis_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
