-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "game";

-- CreateTable
CREATE TABLE "game"."Favorite" (
    "userId" UUID NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "released" DATE,
    "imageUrl" TEXT,
    "rating" DECIMAL(5,2),

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "igdbId"),
    CONSTRAINT "Favorite_igdbId_positive" CHECK ("igdbId" > 0),
    CONSTRAINT "Favorite_rating_range" CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 100))
);

-- CreateTable
CREATE TABLE "game"."FavoritePlatform" (
    "userId" UUID NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "platformId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FavoritePlatform_pkey" PRIMARY KEY ("userId", "igdbId", "platformId"),
    CONSTRAINT "FavoritePlatform_platformId_positive" CHECK ("platformId" > 0),
    CONSTRAINT "FavoritePlatform_favorite_fkey" FOREIGN KEY ("userId", "igdbId") REFERENCES "game"."Favorite"("userId", "igdbId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Favorite_userId_name_igdbId_idx" ON "game"."Favorite"("userId", "name", "igdbId");

-- CreateIndex
CREATE INDEX "Favorite_userId_released_igdbId_idx" ON "game"."Favorite"("userId", "released", "igdbId");

-- CreateIndex
CREATE INDEX "FavoritePlatform_userId_platformId_igdbId_idx" ON "game"."FavoritePlatform"("userId", "platformId", "igdbId");
