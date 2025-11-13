-- CreateTable
CREATE TABLE "UserDislike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "posterPath" TEXT,
    "releaseDate" TEXT,
    "embedding" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDislike_tmdbId_key" ON "UserDislike"("tmdbId");

-- CreateIndex
CREATE INDEX "UserDislike_tmdbId_idx" ON "UserDislike"("tmdbId");
