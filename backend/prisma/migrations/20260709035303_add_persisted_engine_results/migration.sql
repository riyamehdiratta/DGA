-- AlterTable
ALTER TABLE "analysis_results" ADD COLUMN     "doernenburgResult" JSONB,
ADD COLUMN     "duvalPentagon1Result" JSONB,
ADD COLUMN     "duvalPentagon2Result" JSONB,
ADD COLUMN     "duvalTriangleResult" JSONB,
ADD COLUMN     "keyGasResult" JSONB,
ADD COLUMN     "rateResult" JSONB,
ADD COLUMN     "recommendationResult" JSONB,
ADD COLUMN     "statusResult" JSONB;
