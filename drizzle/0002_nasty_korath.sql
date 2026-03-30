ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "passport";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "isVerified";