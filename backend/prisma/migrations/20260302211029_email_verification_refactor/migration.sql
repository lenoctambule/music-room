-- AlterTable: rename verification/reset fields on User
ALTER TABLE "User" DROP COLUMN "verificationCode";
ALTER TABLE "User" DROP COLUMN "verificationCodeExpiry";
ALTER TABLE "User" RENAME COLUMN "resetToken" TO "passwordResetToken";
ALTER TABLE "User" RENAME COLUMN "resetTokenExpiry" TO "passwordResetExpires";
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
