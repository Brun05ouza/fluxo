export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  monthly_income: number;
  onboarding_completed_at: string | null;
  created_at: string;
}
