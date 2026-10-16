-- AlterTable
ALTER TABLE "steps" ADD COLUMN     "alt" TEXT,
ADD COLUMN     "gesture" JSONB,
ADD COLUMN     "highlight_target" TEXT,
ADD COLUMN     "scene" JSONB,
ALTER COLUMN "image_key" DROP NOT NULL;

-- Every step shows exactly one picture: a drawn scene or a screenshot.
ALTER TABLE "steps" ADD CONSTRAINT "steps_scene_or_image" CHECK (("scene" IS NOT NULL) <> ("image_key" IS NOT NULL));
