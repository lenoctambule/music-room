-- DropIndex
DROP INDEX IF EXISTS "User_emailVerificationToken_key";

-- Revert to verification code fields
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerificationToken";
ALTER TABLE "User" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationCodeExpiry" TIMESTAMP(3);
