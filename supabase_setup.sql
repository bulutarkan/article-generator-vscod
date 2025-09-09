-- SUPABASE SETUP SCRIPTS
-- Copy and paste these into your Supabase SQL Editor one by one

-- Step 1: Create ENUM types
CREATE TYPE subscription_plan AS ENUM ('starter', 'pro', 'enterprise', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'expired');

-- Step 2: Create tables
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

-- Articles table with SEO metrics
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  location TEXT NOT NULL,
  tone TEXT NOT NULL,
  articlecontent TEXT NOT NULL,
  metadescription TEXT,
  keywords TEXT[],
  pricecomparison JSONB,
  generalcomparison JSONB,
  monthly_searches INTEGER DEFAULT 0,
  primary_keyword TEXT,
  keyword_difficulty DECIMAL(5,2) DEFAULT 0,
  content_quality TEXT[],
  -- New SEO metrics fields
  seo_readability_score DECIMAL(5,2),
  seo_keyword_density DECIMAL(5,3),
  seo_overall_score INTEGER,
  seo_content_quality INTEGER,
  seo_target_keywords INTEGER,
  seo_technical_seo INTEGER,
  seo_engagement INTEGER,
  seo_structure INTEGER,
  seo_originality INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT seo_scores_valid_range CHECK (
    seo_readability_score >= 0 AND seo_readability_score <= 100 AND
    seo_keyword_density >= 0 AND seo_keyword_density <= 10 AND
    seo_overall_score >= 0 AND seo_overall_score <= 100 AND
    seo_content_quality >= 0 AND seo_content_quality <= 100 AND
    seo_target_keywords >= 0 AND seo_target_keywords <= 100 AND
    seo_technical_seo >= 0 AND seo_technical_seo <= 100 AND
    seo_engagement >= 0 AND seo_engagement <= 100 AND
    seo_structure >= 0 AND seo_structure <= 100 AND
    seo_originality >= 0 AND seo_originality <= 100
  )
);

-- Blog posts table
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

-- Keyword analysis table
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

-- Step 3: Create functions
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

-- Step 4: Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_analysis ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own articles" ON articles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own articles" ON articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles" ON articles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles" ON articles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all subscriptions" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

CREATE POLICY "Admin can update subscriptions" ON user_subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

CREATE POLICY "Admin full access to articles" ON articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

CREATE POLICY "Admin full access to blog_posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

CREATE POLICY "Admin full access to keyword_analysis" ON keyword_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = auth.uid() AND us.plan = 'admin'
    )
  );

-- Step 6: Set up your admin subscription
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
