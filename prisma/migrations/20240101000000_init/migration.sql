-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "UnionType" AS ENUM ('marriage', 'partnership', 'divorced', 'widowed');

-- CreateEnum
CREATE TYPE "ParentalRole" AS ENUM ('biological', 'adoptive', 'step');

-- CreateTable: individuals
CREATE TABLE "individuals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "birth_date" DATE,
    "death_date" DATE,
    "gender" "Gender" NOT NULL,
    "photo_url" TEXT,
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: unions
CREATE TABLE "unions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "partner1_id" UUID NOT NULL,
    "partner2_id" UUID,
    "union_type" "UnionType" NOT NULL DEFAULT 'marriage',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: union_children
CREATE TABLE "union_children" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "union_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "parental_role" "ParentalRole" NOT NULL DEFAULT 'biological',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "union_children_pkey" PRIMARY KEY ("id")
);

-- Indexes for unions
CREATE INDEX "unions_partner1_id_idx" ON "unions"("partner1_id");
CREATE INDEX "unions_partner2_id_idx" ON "unions"("partner2_id");
CREATE UNIQUE INDEX "unions_partner1_id_partner2_id_key" ON "unions"("partner1_id", "partner2_id");

-- Indexes for union_children
CREATE INDEX "union_children_union_id_idx" ON "union_children"("union_id");
CREATE INDEX "union_children_child_id_idx" ON "union_children"("child_id");
CREATE UNIQUE INDEX "union_children_union_id_child_id_key" ON "union_children"("union_id", "child_id");

-- Foreign keys for unions
ALTER TABLE "unions" ADD CONSTRAINT "unions_partner1_id_fkey" FOREIGN KEY ("partner1_id") REFERENCES "individuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unions" ADD CONSTRAINT "unions_partner2_id_fkey" FOREIGN KEY ("partner2_id") REFERENCES "individuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for union_children
ALTER TABLE "union_children" ADD CONSTRAINT "union_children_union_id_fkey" FOREIGN KEY ("union_id") REFERENCES "unions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "union_children" ADD CONSTRAINT "union_children_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "individuals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
