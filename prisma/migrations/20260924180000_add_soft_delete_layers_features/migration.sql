-- AlterTable
ALTER TABLE "layers" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "features" ADD COLUMN "deleted_at" TIMESTAMP(3);
