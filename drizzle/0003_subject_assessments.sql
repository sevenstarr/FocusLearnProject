ALTER TABLE "subjects"
  ADD COLUMN "assessments" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN "grade_max" double precision DEFAULT 10 NOT NULL,
  ADD COLUMN "grading_method" text DEFAULT 'normalized' NOT NULL,
  ADD COLUMN "approval_rules" jsonb DEFAULT '{"directThreshold":7,"finalEligibilityThreshold":4,"finalTarget":5,"finalMaxScore":10,"finalWeight":50}'::jsonb NOT NULL;
--> statement-breakpoint
UPDATE "subjects"
SET "assessments" = jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'name', 'P1', 'score', "p1", 'maxScore', 10, 'weight', 50),
      jsonb_build_object('id', gen_random_uuid()::text, 'name', 'P2', 'score', "p2", 'maxScore', 10, 'weight', 50)
    ),
    "grading_method" = 'normalized',
    "grade_max" = 10,
    "approval_rules" = '{"directThreshold":7,"finalEligibilityThreshold":4,"finalTarget":5,"finalMaxScore":10,"finalWeight":50}'::jsonb;
--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_grade_max_positive" CHECK ("grade_max" > 0);
--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_grading_method_valid" CHECK ("grading_method" IN ('sum', 'normalized', 'weighted'));
