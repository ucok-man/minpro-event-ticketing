-- AlterTable
ALTER TABLE "AuthToken" ALTER COLUMN "refreshExpiredAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "endDate" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "PointBalance" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "endDate" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "expiredAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Voucher" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "expiredAt" SET DATA TYPE TIMESTAMPTZ;
