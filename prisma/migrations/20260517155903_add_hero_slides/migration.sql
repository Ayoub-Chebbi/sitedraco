-- CreateTable
CREATE TABLE "HeroSlide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "discountPrice" REAL,
    "href" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "gradient" TEXT NOT NULL DEFAULT 'from-purple-950/90 via-purple-950/60 to-transparent',
    "accentColor" TEXT NOT NULL DEFAULT 'text-purple-400',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
