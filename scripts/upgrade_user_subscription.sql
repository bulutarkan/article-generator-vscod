-- SQL migration to add billing interval to user_subscriptions table
BEGIN;

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly'));

COMMIT;
