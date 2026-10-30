export type UserRole = 'ADMIN' | 'DEPT_OFFICER' | 'INST_REP' | 'REVIEWER';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  designation?: string;
  institution_id?: number;
  department_id?: number;
  institution_name?: string;
  department_name?: string;
  is_active: boolean;
  created_at: string;
}

export type InstituteType =
  | 'ENGINEERING'
  | 'MANAGEMENT'
  | 'PHARMACY'
  | 'POLYTECHNIC'
  | 'ARCHITECTURE'
  | 'APPLIED_ARTS'
  | 'HOTEL_MANAGEMENT'
  | 'OTHER';

export interface Institution {
  id: number;
  aicte_id: string;
  name: string;
  code?: string;
  institute_type: InstituteType;
  state: string;
  district: string;
  address: string;
  pin_code: string;
  contact_email: string;
  contact_phone: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  contact_email?: string;
  is_active: boolean;
  created_at: string;
  active_complaints_count: number;
  resolved_complaints_count: number;
}

export type ComplaintCategory =
  | 'APPROVAL_AFFILIATION'
  | 'FACULTY_STAFF'
  | 'STUDENT_FEES'
  | 'INFRASTRUCTURE'
  | 'ANTI_RAGGING'
  | 'FUNDS_SCHOLARSHIP'
  | 'EXAM_CURRICULUM'
  | 'GOVERNANCE_CORRUPTION'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING_INSTITUTION'
  | 'RESOLVED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'CLOSED';

export interface ComplaintHistory {
  id: number;
  from_status?: string;
  to_status: string;
  comments: string;
  changed_by_name?: string;
  changed_by_role?: string;
  created_at: string;
}

export interface ComplaintAssignment {
  id: number;
  department_id: number;
  department_name?: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
}

export interface Complaint {
  id: number;
  complaint_id: string;
  institution_id: number;
  institution_name?: string;
  institution_aicte_id?: string;
  institution_state?: string;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  reference_number?: string;
  academic_year: string;
  assigned_department_id?: number;
  assigned_department_name?: string;
  assigned_officer_id?: number;
  assigned_officer_name?: string;
  is_duplicate: boolean;
  primary_complaint_id?: number;
  primary_complaint_code?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  complainant_name?: string;
  complainant_email?: string;
  resolution_notes?: string;
  resolution_date?: string;
  status_history?: ComplaintHistory[];
  assignments?: ComplaintAssignment[];
  potential_duplicate_count?: number;
}

export interface DuplicateSuggestion {
  id: number;
  complaint_id: number;
  complaint_code: string;
  complaint_title: string;
  complaint_category: string;
  complaint_institution_name: string;
  complaint_created_at: string;
  potential_duplicate_id: number;
  potential_code: string;
  potential_title: string;
  potential_category: string;
  potential_institution_name: string;
  potential_created_at: string;
  similarity_score: number;
  matched_keywords?: string;
  status: 'PENDING' | 'CONFIRMED_DUPLICATE' | 'REJECTED_DUPLICATE';
  suggested_at: string;
  reviewed_by_name?: string;
  review_notes?: string;
  reviewed_at?: string;
}

export interface DepartmentCoordination {
  id: number;
  complaint_id: number;
  complaint_code?: string;
  from_department_id: number;
  from_department_name?: string;
  to_department_id: number;
  to_department_name?: string;
  initiated_by_name?: string;
  subject: string;
  message: string;
  response_message?: string;
  responded_by_name?: string;
  responded_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  total_complaints: number;
  pending_complaints: number;
  under_review_complaints: number;
  assigned_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  rejected_complaints: number;
  duplicate_complaints: number;
  total_institutions: number;
  total_departments: number;
  avg_resolution_days: number;
  category_breakdown: { name: string; count: number; percentage: number }[];
  status_breakdown: { name: string; count: number; percentage: number }[];
  priority_breakdown: { name: string; count: number; percentage: number }[];
  monthly_trends: { month: string; submitted: number; resolved: number }[];
  department_workload: {
    department_id: number;
    name: string;
    code: string;
    total_assigned: number;
    in_progress: number;
    resolved: number;
  }[];
  top_institutions_by_complaints: {
    id: number;
    name: string;
    aicte_id: string;
    state: string;
    complaint_count: number;
  }[];
  state_breakdown: { name: string; count: number; percentage: number }[];
}
