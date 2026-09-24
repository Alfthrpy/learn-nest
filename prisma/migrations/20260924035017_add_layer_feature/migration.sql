/*
  Warnings:

  - You are about to drop the column `geom` on the `districts` table. All the data in the column will be lost.
  - You are about to drop the column `point` on the `places` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[feature_id]` on the table `districts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[feature_id]` on the table `places` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `feature_id` to the `districts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feature_id` to the `places` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "places_name_key";

-- AlterTable
ALTER TABLE "districts" DROP COLUMN "geom",
ADD COLUMN     "feature_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "places" DROP COLUMN "point",
ADD COLUMN     "feature_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "layers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "data_type" TEXT,
    "description" TEXT,
    "properties" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "geom" geometry(Geometry, 4326) NOT NULL,
    "name" TEXT,
    "properties" JSONB,
    "layer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "layers_name_key" ON "layers"("name");

-- CreateIndex
CREATE INDEX "features_layer_id_idx" ON "features"("layer_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_feature_id_key" ON "districts"("feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "places_feature_id_key" ON "places"("feature_id");

-- CreateIndex
CREATE INDEX "places_district_id_idx" ON "places"("district_id");

-- CreateIndex
CREATE INDEX "places_user_id_idx" ON "places"("user_id");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "layers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
