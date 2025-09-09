import { Subscription, SubscriptionPlan } from '../types/subscription';
import { supabase } from '../supabase';

export async function updateSubscription(
  userId: string,
  newPlan: Subscription['plan'],
  features: Partial<Subscription['features']>
): Promise<void> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({
      plan: newPlan,
      features: { ...features },
    })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data;
}

export async function createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  features: Subscription['features'],
  billingInterval?: 'monthly' | 'yearly'
): Promise<void> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      status: 'active',
      plan: plan,
      features: features,
      billing_interval: billingInterval,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw error;
  }

  return data || null;
}

export async function updateBillingInterval(
  userId: string,
  billingInterval: 'monthly' | 'yearly'
): Promise<void> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({ billing_interval: billingInterval })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}
