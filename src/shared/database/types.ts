import type { Generated, ColumnType } from 'kysely';

// ---------- Instructors ----------
export interface InstructorTable {
  id: Generated<string>;
  organization_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

// ---------- Students ----------
export interface StudentTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  affiliation_number: Generated<string>;
  qr_code: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

// ---------- Dance Groups ----------
export interface DanceGroupTable {
  id: Generated<string>;
  organization_id: string;
  instructor_id: string;
  name: string;
  description: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  capacity: number;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

// ---------- Enrollments ----------
export interface EnrollmentTable {
  id: Generated<string>;
  group_id: string;
  student_id: string;
  enrolled_at: Generated<Date>;
  unenrolled_at: Date | null;
  is_active: Generated<boolean>;
}

// ---------- Attendance ----------
export interface AttendanceTable {
  id: Generated<string>;
  student_id: string;
  group_id: string;
  date: Generated<Date>;
  type: 'qr' | 'number' | 'manual';
  registered_at: Generated<Date>;
}

// ---------- Memberships ----------
export interface MembershipTable {
  id: Generated<string>;
  student_id: string;
  organization_id: string;
  start_date: Date;
  end_date: Date;
  amount: ColumnType<string, string, string>; // numeric stored as string
  status: Generated<'active' | 'expired' | 'cancelled'>;
  created_at: Generated<Date>;
}

// ---------- Payments ----------
export interface PaymentTable {
  id: Generated<string>;
  membership_id: string;
  student_id: string;
  organization_id: string;
  amount: ColumnType<string, string, string>; // numeric stored as string
  paid_at: Generated<Date>;
  type: 'full' | 'partial';
  notes: string | null;
  created_at: Generated<Date>;
}

// ---------- Payment Reminders ----------
export interface PaymentReminderTable {
  id: Generated<string>;
  membership_id: string;
  reminder_type: string;
  sent_at: Generated<Date>;
}

// ---------- SaaS Plans ----------
export interface SaaSPlanTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  price: ColumnType<string, string, string>; // numeric stored as string
  currency: string;
  interval: string;
  features: unknown; // jsonb
  stripe_price_id: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

// ---------- SaaS Subscriptions ----------
export interface SaasSubscriptionTable {
  id: Generated<string>;
  organization_id: string;
  plan_id: string;
  status: string;
  stripe_subscription_id: string | null;
  current_period_start: Date | null;
  current_period_end: Date | null;
  cancel_at_period_end: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

// ---------- Database interface ----------
export interface Database {
  instructor: InstructorTable;
  student: StudentTable;
  dance_group: DanceGroupTable;
  enrollment: EnrollmentTable;
  attendance: AttendanceTable;
  membership: MembershipTable;
  payment: PaymentTable;
  payment_reminder: PaymentReminderTable;
  saas_plans: SaaSPlanTable;
  saas_subscriptions: SaasSubscriptionTable;
}
