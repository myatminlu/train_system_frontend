import axios from 'axios';
import type {
  AuthResponse,
  UserLoginRequest,
  UserRegisterRequest,
  StationsResponse,
  Station,
  RouteRequest,
  RouteResponse,
  PlannedRoute,
  StationSchedule,
  AdminLoginResponse,
  ApiError,
  PassengerType,
  PassengerTypesResponse,
} from '../types';

// Define admin types locally to avoid import issues
interface AdminLoginRequest {
  username: string;
  password: string;
  totp_code?: string;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'operator' | 'viewer' | 'analyst';
  is_active: boolean;
  is_2fa_enabled: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  permissions: string[];
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login only if not already on login page
      localStorage.removeItem('authToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Admin API instance
const adminApi = axios.create({
  baseURL: 'http://localhost:8000/api/v1/admin',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  register: async (userData: UserRegisterRequest): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  login: async (credentials: UserLoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Station Services
export const stationService = {
  getAllStations: async (page: number = 1, limit: number = 50): Promise<StationsResponse> => {
    const { data } = await api.get(`/stations/?page=${page}&limit=${limit}`);
    return data;
  },

  getStationById: async (id: number): Promise<Station> => {
    const { data } = await api.get(`/stations/${id}`);
    return data;
  },

  searchStations: async (query: string): Promise<Station[]> => {
    const { data } = await api.get(`/stations/search?q=${encodeURIComponent(query)}`);
    return data.stations;
  },
};

// Route Planning Services
export const routeService = {
  planRoute: async (request: RouteRequest): Promise<RouteResponse> => {
    const { data } = await api.post('/routes/plan', request);
    return data;
  },

  searchRoutes: async (
    fromStation: number,
    toStation: number,
    departureTime: string,
    optimization: 'time' | 'cost' | 'transfers',
    passengerTypeId: number = 1
  ): Promise<{ routes: PlannedRoute[] }> => {
    const { data } = await api.post('/routes/plan', {
      from_station_id: fromStation,
      to_station_id: toStation,
      departure_time: departureTime,
      passenger_type_id: passengerTypeId,
      optimization,
      max_walking_time: 10,
      max_transfers: 2,
      avoid_lines: [],
      prefer_lines: []
    });
    return data;
  },
  
  getPassengerTypes: async (): Promise<PassengerTypesResponse> => {
    const { data } = await api.get('/routes/passenger-types');
    return data;
  },

  validateRoute: async (request: RouteRequest): Promise<{ is_valid: boolean; errors: string[] }> => {
    const { data } = await api.post('/routes/validate', request);
    return data;
  },
};

// Schedule Services
export const scheduleService = {
  getStationSchedule: async (stationId: number, hoursAhead: number = 2): Promise<StationSchedule> => {
    const { data } = await api.get(`/schedules/station/${stationId}?hours_ahead=${hoursAhead}`);
    return data;
  },

  getNextDepartures: async (stationIds: number[], limit: number = 5) => {
    const { data } = await api.get(
      `/schedules/departures/next?station_ids=${stationIds.join(',')}&limit=${limit}`
    );
    return data;
  },

  getServiceStatus: async () => {
    const { data } = await api.get('/schedules/service-status');
    return data;
  },
};

// Admin Services - Deprecated, use unified authService instead
export const adminAuthService = {
  login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
    // Use the unified login endpoint
    const { data } = await api.post('/auth/login', {
      email: credentials.username, // Map username to email for the unified API
      password: credentials.password
    });
    
    // Transform the response to match AdminLoginResponse format
    return {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: 28800, // 8 hours default
      admin_user: data.user,
      permissions: data.user.roles,
      requires_2fa: false
    };
  },

  logout: async (): Promise<void> => {
    // No specific logout endpoint needed for admin
    localStorage.removeItem('authToken');
  },

  getCurrentUser: async (): Promise<AdminUser> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export const adminUserService = {
  getAllUsers: async (skip: number = 0, limit: number = 100): Promise<AdminUser[]> => {
    const { data } = await adminApi.get(`/users?skip=${skip}&limit=${limit}`);
    return data;
  },

  getUserById: async (id: number): Promise<AdminUser> => {
    const { data } = await adminApi.get(`/users/${id}`);
    return data;
  },

  createUser: async (userData: any): Promise<AdminUser> => {
    const { data } = await adminApi.post('/users', userData);
    return data;
  },

  updateUser: async (id: number, userData: any): Promise<AdminUser> => {
    const { data } = await adminApi.put(`/users/${id}`, userData);
    return data;
  },
};

// Combined admin service with all available endpoints from Postman collection
export const adminService = {
  // Dashboard & Metrics
  getDashboardData: async (): Promise<any> => {
    const { data } = await adminApi.get('/dashboard');
    return data;
  },

  getSystemMetrics: async (): Promise<any> => {
    const { data } = await adminApi.get('/metrics');
    return data;
  },

  // System Health
  getSystemHealth: async (): Promise<any> => {
    const { data } = await adminApi.get('/health');
    return data;
  },

  getHealthComponents: async (): Promise<any> => {
    const { data } = await adminApi.get('/health/components');
    return data;
  },

  // Performance
  getCurrentPerformance: async (): Promise<any> => {
    const { data } = await adminApi.get('/performance/current');
    return data;
  },

  getPerformanceReport: async (hours: number = 24): Promise<any> => {
    const { data } = await adminApi.get(`/performance/report?hours=${hours}`);
    return data;
  },

  // User Management
  getUsers: async (skip: number = 0, limit: number = 100, role?: string): Promise<any> => {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (role) params.append('role', role);
    const { data } = await adminApi.get(`/users?${params.toString()}`);
    return data;
  },

  getUserById: async (id: number): Promise<any> => {
    const { data } = await adminApi.get(`/users/${id}`);
    return data;
  },

  createUser: async (userData: any): Promise<any> => {
    const { data } = await adminApi.post('/users', userData);
    return data;
  },

  updateUser: async (id: number, userData: any): Promise<any> => {
    const { data } = await adminApi.put(`/users/${id}`, userData);
    return data;
  },

  manageUser: async (id: number, action: 'activate' | 'deactivate', reason?: string): Promise<any> => {
    const { data } = await adminApi.post(`/users/${id}/manage`, { action, reason });
    return data;
  },

  // Station Management
  createStation: async (stationData: any): Promise<any> => {
    const { data } = await adminApi.post('/stations', stationData);
    return data;
  },

  updateStation: async (id: number, stationData: any): Promise<any> => {
    const { data } = await adminApi.put(`/stations/${id}`, stationData);
    return data;
  },

  deleteStation: async (id: number): Promise<void> => {
    await adminApi.delete(`/stations/${id}`);
  },

  bulkStationOperations: async (operation: string, stationIds: number[], operationData: any): Promise<any> => {
    const { data } = await adminApi.post('/stations/bulk', {
      operation,
      station_ids: stationIds,
      operation_data: operationData,
    });
    return data;
  },

  importStations: async (importFormat: string, stationsData: any[], validationMode: string = 'strict'): Promise<any> => {
    const { data } = await adminApi.post('/stations/import', {
      import_format: importFormat,
      stations_data: stationsData,
      validation_mode: validationMode,
    });
    return data;
  },

  // Analytics
  getBookingAnalytics: async (params: {
    date_from: string;
    date_to: string;
    group_by?: 'day' | 'week' | 'month';
    include_cancelled?: boolean;
    filter_by_line?: number[];
  }): Promise<any> => {
    const { data } = await adminApi.post('/analytics/bookings', params);
    return data;
  },

  getRoutePopularity: async (limit: number = 10): Promise<any> => {
    const { data } = await adminApi.get(`/analytics/routes?limit=${limit}`);
    return data;
  },

  getRevenueReport: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> => {
    const { data } = await adminApi.get(`/analytics/revenue?period=${period}`);
    return data;
  },

  getUserAnalytics: async (): Promise<any> => {
    const { data } = await adminApi.get('/analytics/users');
    return data;
  },

  // System Configuration
  getSystemConfig: async (category?: string): Promise<any> => {
    const params = category ? `?category=${category}` : '';
    const { data } = await adminApi.get(`/config${params}`);
    return data;
  },

  updateSystemConfig: async (configUpdates: Array<{
    key: string;
    value: string;
    category: string;
  }>): Promise<any> => {
    const { data } = await adminApi.put('/config', { config_updates: configUpdates });
    return data;
  },

  // System Alerts
  getSystemAlerts: async (activeOnly?: boolean, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<any> => {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('active_only', activeOnly.toString());
    if (severity) params.append('severity', severity);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const { data } = await adminApi.get(`/alerts${queryString}`);
    return data;
  },

  resolveAlert: async (alertId: string): Promise<any> => {
    const { data } = await adminApi.post(`/alerts/${alertId}/resolve`);
    return data;
  },

  // Audit Logs
  getAuditLogs: async (params: {
    limit?: number;
    action?: string;
    resource?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<any> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, value.toString());
    });
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const { data } = await adminApi.get(`/audit-logs${queryString}`);
    return data;
  },

  // Backup & Maintenance
  getBackupStatus: async (): Promise<any> => {
    const { data } = await adminApi.get('/backup/status');
    return data;
  },

  createBackup: async (): Promise<any> => {
    const { data } = await adminApi.post('/backup/create');
    return data;
  },

  getMaintenanceWindows: async (activeOnly?: boolean): Promise<any> => {
    const params = activeOnly !== undefined ? `?active_only=${activeOnly}` : '';
    const { data } = await adminApi.get(`/maintenance/windows${params}`);
    return data;
  },

  createMaintenanceWindow: async (maintenanceData: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    affected_systems: string[];
    maintenance_type: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<any> => {
    const { data } = await adminApi.post('/maintenance/windows', maintenanceData);
    return data;
  },

  // Permissions
  getPermissions: async (): Promise<any> => {
    const { data } = await adminApi.get('/permissions');
    return data;
  },

  getRolePermissions: async (role: string): Promise<any> => {
    const { data } = await adminApi.get(`/roles/${role}/permissions`);
    return data;
  },

  // 2FA Management
  setup2FA: async (): Promise<any> => {
    const { data } = await adminApi.post('/auth/2fa/setup');
    return data;
  },

  verify2FA: async (totpCode: string): Promise<any> => {
    const { data } = await adminApi.post('/auth/2fa/verify', { totp_code: totpCode });
    return data;
  },

  // Legacy methods for backward compatibility
  getDashboardStats: async (): Promise<{
    total_users: number;
    total_stations: number;
    total_routes: number;
    active_schedules: number;
  }> => {
    const data = await adminService.getDashboardData();
    return {
      total_users: data.total_users || 0,
      total_stations: data.total_stations || 0,
      total_routes: data.total_routes || 0,
      active_schedules: data.active_schedules || 0,
    };
  },

  getStations: async (): Promise<any[]> => {
    const { data } = await adminApi.get('/stations');
    return data;
  },

  // Line Management
  getLines: async (): Promise<any[]> => {
    const { data } = await adminApi.get('/lines');
    return data;
  },

  createLine: async (lineData: any): Promise<any> => {
    const { data } = await adminApi.post('/lines', lineData);
    return data;
  },

  updateLine: async (id: number, lineData: any): Promise<any> => {
    const { data } = await adminApi.put(`/lines/${id}`, lineData);
    return data;
  },

  deleteLine: async (id: number): Promise<void> => {
    await adminApi.delete(`/lines/${id}`);
  },

  // Service Status Management
  getServiceStatuses: async (filters?: { line_id?: number; station_id?: number; active_only?: boolean }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.line_id) params.append('line_id', filters.line_id.toString());
    if (filters?.station_id) params.append('station_id', filters.station_id.toString());
    if (filters?.active_only !== undefined) params.append('active_only', filters.active_only.toString());
    
    const { data } = await adminApi.get(`/service-status?${params.toString()}`);
    return data;
  },

  createServiceStatus: async (statusData: any): Promise<any> => {
    const { data } = await adminApi.post('/service-status', statusData);
    return data;
  },

  updateServiceStatus: async (id: number, statusData: any): Promise<any> => {
    const { data } = await adminApi.put(`/service-status/${id}`, statusData);
    return data;
  },

  deleteServiceStatus: async (id: number): Promise<void> => {
    await adminApi.delete(`/service-status/${id}`);
  },

  resolveServiceStatus: async (id: number): Promise<any> => {
    const { data } = await adminApi.post(`/service-status/${id}/resolve`);
    return data;
  },

  // Regular User Management
  getRegularUsers: async (params?: { skip?: number; limit?: number; search?: string }): Promise<any[]> => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const { data } = await adminApi.get(`/regular-users?${searchParams.toString()}`);
    return data;
  },

  getRegularUser: async (id: number): Promise<any> => {
    const { data } = await adminApi.get(`/regular-users/${id}`);
    return data;
  },

  updateRegularUser: async (id: number, userData: any): Promise<any> => {
    const { data } = await adminApi.put(`/regular-users/${id}`, userData);
    return data;
  },

  deleteRegularUser: async (id: number): Promise<void> => {
    await adminApi.delete(`/regular-users/${id}`);
  },

  getUserStatistics: async (): Promise<any> => {
    const { data } = await adminApi.get('/user-statistics');
    return data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await adminService.manageUser(id, 'deactivate', 'User deleted by administrator');
  },

  getSchedules: async (): Promise<{ schedules: any[] }> => {
    const { data } = await api.get('/schedules/service-status');
    return { schedules: data.schedules || [] };
  },

  createSchedule: async (scheduleData: any): Promise<any> => {
    const { data } = await api.post('/schedules/maintenance', scheduleData);
    return data;
  },

  updateSchedule: async (id: number, scheduleData: any): Promise<any> => {
    const { data } = await api.put(`/schedules/alerts/${id}`, scheduleData);
    return data;
  },

  deleteSchedule: async (id: number): Promise<void> => {
    await api.delete(`/schedules/alerts/${id}`);
  },

  // Bulk Import/Export Operations
  bulkImportLines: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await adminApi.post('/bulk/import/lines', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  bulkImportUsers: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await adminApi.post('/bulk/import/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  bulkImportServiceStatus: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await adminApi.post('/bulk/import/service-status', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  bulkExportLines: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await adminApi.get(`/bulk/export/lines?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  bulkExportUsers: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await adminApi.get(`/bulk/export/users?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  bulkExportServiceStatus: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await adminApi.get(`/bulk/export/service-status?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  bulkExportStations: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await adminApi.get(`/bulk/export/stations?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getImportTemplate: async (dataType: 'lines' | 'users' | 'service-status' | 'stations'): Promise<Blob> => {
    const response = await adminApi.get(`/bulk/templates/${dataType}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Fare Rules Management
  getFareRules: async (filters?: { route_id?: number; passenger_type_id?: number; active_only?: boolean }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.route_id) params.append('route_id', filters.route_id.toString());
    if (filters?.passenger_type_id) params.append('passenger_type_id', filters.passenger_type_id.toString());
    if (filters?.active_only !== undefined) params.append('active_only', filters.active_only.toString());
    
    const { data } = await adminApi.get(`/fare-rules?${params.toString()}`);
    return data;
  },

  createFareRule: async (fareRuleData: any): Promise<any> => {
    const { data } = await adminApi.post('/fare-rules', fareRuleData);
    return data;
  },

  updateFareRule: async (id: number, fareRuleData: any): Promise<any> => {
    const { data } = await adminApi.put(`/fare-rules/${id}`, fareRuleData);
    return data;
  },

  deleteFareRule: async (id: number): Promise<void> => {
    await adminApi.delete(`/fare-rules/${id}`);
  },

  bulkFareRules: async (operation: { operation: string; fare_rule_ids: number[]; update_data?: any }): Promise<any> => {
    const { data } = await adminApi.post('/fare-rules/bulk', operation);
    return data;
  },

  // Route Management
  getRoutes: async (filters?: {
    from_station_id?: number;
    to_station_id?: number;
    status?: string;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.from_station_id) params.append('from_station_id', filters.from_station_id.toString());
    if (filters?.to_station_id) params.append('to_station_id', filters.to_station_id.toString());
    if (filters?.status) params.append('status', filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const { data } = await adminApi.get(`/routes${queryString}`);
    return data;
  },

  createRoute: async (routeData: {
    from_station_id: number;
    to_station_id: number;
    distance?: number;
    estimated_duration?: number;
    status?: string;
  }): Promise<any> => {
    const { data } = await adminApi.post('/routes', routeData);
    return data;
  },

  updateRoute: async (routeId: number, routeData: {
    from_station_id?: number;
    to_station_id?: number;
    distance?: number;
    estimated_duration?: number;
    status?: string;
  }): Promise<any> => {
    const { data } = await adminApi.put(`/routes/${routeId}`, routeData);
    return data;
  },

  deleteRoute: async (routeId: number): Promise<any> => {
    const { data } = await adminApi.delete(`/routes/${routeId}`);
    return data;
  },

  bulkRoutes: async (operation: {
    operation: 'update' | 'delete' | 'activate' | 'deactivate';
    route_ids: number[];
    update_data?: any;
  }): Promise<any> => {
    const { data } = await adminApi.post('/routes/bulk', operation);
    return data;
  },

  getPassengerTypes: async (): Promise<any[]> => {
    const { data } = await adminApi.get('/passenger-types');
    return data;
  },

  // Company Management
  getCompanies: async (filters?: { region_id?: number; status?: string }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.region_id) params.append('region_id', filters.region_id.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const { data } = await adminApi.get(`/companies?${params.toString()}`);
    return data;
  },

  createCompany: async (companyData: any): Promise<any> => {
    const { data } = await adminApi.post('/companies', companyData);
    return data;
  },

  updateCompany: async (id: number, companyData: any): Promise<any> => {
    const { data } = await adminApi.put(`/companies/${id}`, companyData);
    return data;
  },

  deleteCompany: async (id: number): Promise<void> => {
    await adminApi.delete(`/companies/${id}`);
  },

  bulkCompanies: async (operation: { operation: string; company_ids: number[]; update_data?: any }): Promise<any> => {
    const { data } = await adminApi.post('/companies/bulk', operation);
    return data;
  },

  // Regions for company management
  getRegions: async (): Promise<any[]> => {
    const { data } = await adminApi.get('/regions');
    return data;
  },

  // Train Service Management
  getTrainServices: async (filters?: {
    line_id?: number;
    is_active?: boolean;
    direction?: string;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.line_id) params.append('line_id', filters.line_id.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.direction) params.append('direction', filters.direction);
    
    const { data } = await adminApi.get(`/train-services?${params.toString()}`);
    return data;
  },

  createTrainService: async (serviceData: any): Promise<any> => {
    const { data } = await adminApi.post('/train-services', serviceData);
    return data;
  },

  updateTrainService: async (id: number, serviceData: any): Promise<any> => {
    const { data } = await adminApi.put(`/train-services/${id}`, serviceData);
    return data;
  },

  deleteTrainService: async (id: number): Promise<void> => {
    await adminApi.delete(`/train-services/${id}`);
  },

  getTrainServiceTimetable: async (id: number): Promise<any> => {
    const { data } = await adminApi.get(`/train-services/${id}/timetable`);
    return data;
  },

  bulkTrainServices: async (operation: {
    operation: 'update' | 'delete' | 'activate' | 'deactivate';
    service_ids: number[];
    update_data?: any;
  }): Promise<any> => {
    const { data } = await adminApi.post('/train-services/bulk', operation);
    return data;
  },

  // Transfer Points Management
  getTransferPoints: async (filters?: {
    station_a_id?: number;
    station_b_id?: number;
    is_active?: boolean;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.station_a_id) params.append('station_a_id', filters.station_a_id.toString());
    if (filters?.station_b_id) params.append('station_b_id', filters.station_b_id.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    
    const { data } = await adminApi.get(`/transfer-points?${params.toString()}`);
    return data;
  },

  createTransferPoint: async (transferPointData: any): Promise<any> => {
    const { data } = await adminApi.post('/transfer-points', transferPointData);
    return data;
  },

  updateTransferPoint: async (id: number, transferPointData: any): Promise<any> => {
    const { data } = await adminApi.put(`/transfer-points/${id}`, transferPointData);
    return data;
  },

  deleteTransferPoint: async (id: number): Promise<void> => {
    await adminApi.delete(`/transfer-points/${id}`);
  },

  bulkTransferPoints: async (operation: {
    operation: 'update' | 'delete' | 'activate' | 'deactivate';
    transfer_point_ids: number[];
    update_data?: any;
  }): Promise<any> => {
    const { data } = await adminApi.post('/transfer-points/bulk', operation);
    return data;
  },
};

// Health Check
export const healthService = {
  checkHealth: async (): Promise<{ status: string }> => {
    const { data } = await axios.get('http://localhost:8000/health');
    return data;
  },
};

// Error handling helper
export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return {
      detail: error.response.data?.detail || 'An error occurred',
      status_code: error.response.status,
    };
  } else if (error.request) {
    return {
      detail: 'Network error - please check your connection',
      status_code: 0,
    };
  } else {
    return {
      detail: error.message || 'An unexpected error occurred',
      status_code: 0,
    };
  }
};

export default api;