export interface Subscription {
  id: string;
  user_id: string;
  plan: 'starter' | 'pro' | 'enterprise' | 'admin';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date?: Date;
  end_date?: Date;
  billing_interval?: 'monthly' | 'yearly';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  features: {
    article_limit?: number;
    bulk_generation?: boolean;
    api_access?: boolean;
    priority_support?: boolean;
    advanced_analytics?: boolean;
    admin_panel?: boolean;
    wordpress_integration?: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

export enum SubscriptionPlan {
  Starter = 'starter',
  Pro = 'pro',
  Enterprise = 'enterprise',
  Admin = 'admin'
}

export enum SubscriptionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Cancelled = 'cancelled',
  Expired = 'expired'
}
