-- Create subscription plans enum
CREATE TYPE subscription_plan AS ENUM ('starter', 'pro', 'enterprise', 'admin');

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'starter',
  status subscription_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  features JSONB DEFAULT '{
    "article_limit": 10,
    "bulk_generation": false,
    "api_access": false,
    "priority_support": false,
    "advanced_analytics": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create blog_posts table for storing WordPress posts data
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wordpress_id BIGINT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'publish',
  post_date TIMESTAMPTZ,
  modified_date TIMESTAMPTZ,
  slug TEXT,
  categories TEXT[],
  tags TEXT[],
  keywords TEXT[],
  monthly_searches INTEGER DEFAULT 0,
  primary_keyword TEXT,
  keyword_difficulty DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create keyword_analysis table for storing AI-generated keyword suggestions
CREATE TABLE IF NOT EXISTS keyword_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  source_keywords TEXT[],
  long_tail_keywords JSONB,
  related_topics JSONB,
  search_volumes JSONB,
  competition_levels JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin subscription for tarkan96@gmail.com
INSERT INTO user_subscriptions (user_id, plan, status, features)
SELECT
  u.id,
  'admin'::subscription_plan,
  'active'::subscription_status,
  '{
    "article_limit": -1,
    "bulk_generation": true,
    "api_access": true,
    "priority_support": true,
    "advanced_analytics": true,
    "admin_panel": true,
    "wordpress_integration": true
  }'::jsonb
FROM auth.users u
WHERE u.email = 'tarkanbulut96@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Create RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_analysis ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own subscription
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admin to read all subscriptions
CREATE POLICY "Admin can read all subscriptions" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

-- Allow admin to update subscriptions
CREATE POLICY "Admin can update subscriptions" ON user_subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

-- Allow admin full access to blog_posts
CREATE POLICY "Admin full access to blog_posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

-- Allow admin full access to keyword_analysis
CREATE POLICY "Admin full access to keyword_analysis" ON keyword_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

-- Create function to get user subscription
CREATE OR REPLACE FUNCTION get_user_subscription()
RETURNS TABLE (
  plan subscription_plan,
  status subscription_status,
  features JSONB,
  end_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT us.plan, us.status, us.features, us.end_date
  FROM user_subscriptions us
  WHERE us.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_features JSONB;
BEGIN
  SELECT features INTO user_features
  FROM user_subscriptions
  WHERE user_id = auth.uid();

  IF user_features IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN (user_features->>feature_name)::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
