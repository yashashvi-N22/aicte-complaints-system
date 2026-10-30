import {
  User,
  Institution,
  Department,
  Complaint,
  DuplicateSuggestion,
  DepartmentCoordination,
  AuditLog,
  DashboardStats,
  ComplaintStatus,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('aicte_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errData = await res.json();
      errorMsg = errData.detail || errData.message || JSON.stringify(errData);
    } catch {
      errorMsg = res.statusText || `Request failed with status ${res.status}`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<{ access_token: string; user: User }>(res);
    localStorage.setItem('aicte_auth_token', data.access_token);
    localStorage.setItem('aicte_user', JSON.stringify(data.user));
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  logout(): void {
    localStorage.removeItem('aicte_auth_token');
    localStorage.removeItem('aicte_user');
  },

  // Analytics
  async getDashboardAnalytics(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardStats>(res);
  },

  // Institutions
  async getInstitutions(params: {
    q?: string;
    state?: string;
    district?: string;
    institute_type?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Institution[]; total: number; page: number; total_pages: number }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.state) query.set('state', params.state);
    if (params.district) query.set('district', params.district);
    if (params.institute_type) query.set('institute_type', params.institute_type);
    if (params.is_active !== undefined) query.set('is_active', String(params.is_active));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${API_BASE}/institutions?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getStatesAndDistricts(): Promise<{ state: string; districts: string[] }[]> {
    const res = await fetch(`${API_BASE}/institutions/meta/states`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getInstitutionProfile(id: number): Promise<Institution & { complaints: any[]; status_breakdown: Record<string, number> }> {
    const res = await fetch(`${API_BASE}/institutions/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createInstitution(data: Partial<Institution>): Promise<Institution> {
    const res = await fetch(`${API_BASE}/institutions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Institution>(res);
  },

  async updateInstitution(id: number, data: Partial<Institution>): Promise<Institution> {
    const res = await fetch(`${API_BASE}/institutions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Institution>(res);
  },

  async toggleInstitutionStatus(id: number): Promise<Institution> {
    const res = await fetch(`${API_BASE}/institutions/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse<Institution>(res);
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${API_BASE}/departments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Department[]>(res);
  },

  // Complaints
  async getComplaints(params: {
    q?: string;
    status?: string;
    priority?: string;
    category?: string;
    department_id?: number;
    institution_id?: number;
    is_duplicate?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Complaint[]; total: number; page: number; total_pages: number }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.status) query.set('status', params.status);
    if (params.priority) query.set('priority', params.priority);
    if (params.category) query.set('category', params.category);
    if (params.department_id) query.set('department_id', String(params.department_id));
    if (params.institution_id) query.set('institution_id', String(params.institution_id));
    if (params.is_duplicate !== undefined) query.set('is_duplicate', String(params.is_duplicate));
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${API_BASE}/complaints?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getComplaint(id: number): Promise<Complaint> {
    const res = await fetch(`${API_BASE}/complaints/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Complaint>(res);
  },

  async createComplaint(data: {
    institution_id?: number;
    title: string;
    description: string;
    category: string;
    priority: string;
    reference_number?: string;
    academic_year?: string;
  }): Promise<Complaint> {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Complaint>(res);
  },

  async updateComplaintStatus(id: number, status: ComplaintStatus, comments: string): Promise<Complaint> {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, comments }),
    });
    return handleResponse<Complaint>(res);
  },

  async assignComplaint(
    id: number,
    departmentId: number,
    assignedOfficerId?: number,
    instructions?: string
  ): Promise<Complaint> {
    const res = await fetch(`${API_BASE}/complaints/${id}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        department_id: departmentId,
        assigned_officer_id: assignedOfficerId || null,
        instructions: instructions || null,
      }),
    });
    return handleResponse<Complaint>(res);
  },

  async getCoordinations(complaintId: number): Promise<DepartmentCoordination[]> {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/coordinations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DepartmentCoordination[]>(res);
  },

  async createCoordination(data: {
    complaint_id: number;
    to_department_id: number;
    subject: string;
    message: string;
  }): Promise<DepartmentCoordination> {
    const res = await fetch(`${API_BASE}/complaints/${data.complaint_id}/coordinations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<DepartmentCoordination>(res);
  },

  async respondCoordination(coordId: number, responseMessage: string, markResolved = true): Promise<DepartmentCoordination> {
    const res = await fetch(`${API_BASE}/complaints/coordinations/${coordId}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        response_message: responseMessage,
        mark_resolved: markResolved,
      }),
    });
    return handleResponse<DepartmentCoordination>(res);
  },

  // Duplicates
  async getDuplicateSuggestions(status?: string): Promise<DuplicateSuggestion[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/duplicates${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DuplicateSuggestion[]>(res);
  },

  async reviewDuplicateSuggestion(
    id: number,
    status: 'CONFIRMED_DUPLICATE' | 'REJECTED_DUPLICATE',
    reviewNotes: string,
    primaryComplaintId?: number
  ): Promise<DuplicateSuggestion> {
    const res = await fetch(`${API_BASE}/duplicates/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        review_notes: reviewNotes,
        primary_complaint_id: primaryComplaintId || null,
      }),
    });
    return handleResponse<DuplicateSuggestion>(res);
  },

  async triggerDuplicateScan(): Promise<{ scanned_complaints_count: number; new_duplicate_suggestions_found: number }> {
    const res = await fetch(`${API_BASE}/duplicates/scan-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Audit Logs
  async getAuditLogs(params: { action?: string; entity_type?: string; page?: number; page_size?: number }): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    total_pages: number;
  }> {
    const query = new URLSearchParams();
    if (params.action) query.set('action', params.action);
    if (params.entity_type) query.set('entity_type', params.entity_type);
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markNotificationRead(id: number): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },
};
