// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UnifiedUser;
}

// Unified User Response (for both regular users and admins)  
export interface UnifiedUser {
  id: number;
  email: string;
  is_admin: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
  
  // Fields for regular users
  name?: string;
  
  // Fields for admin users
  username?: string;
  full_name?: string;
  is_active?: boolean;
  is_2fa_enabled?: boolean;
  last_login?: string;
}

// Station Types
export interface Station {
  id: number;
  name: string;
  lat?: number;
  long?: number;
  line_id: number;
  zone_number?: number;
  is_interchange: boolean;
  platform_count: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
  line?: TrainLine;
  transfer_connections?: Station[];
  facilities?: StationFacility[];
}

export interface TrainLine {
  id: number;
  company_id: number;
  name: string;
  color?: string;
  status: string;
  created_at: string;
  updated_at: string;
  company?: TrainCompany;
}

export interface TrainCompany {
  id: number;
  name: string;
  status: string;
  region_id?: number;
  created_at: string;
  updated_at: string;
}

export interface StationFacility {
  id: number;
  station_id: number;
  facility_type: string;
  is_available: boolean;
  location_description?: string;
  created_at: string;
}

// Route Planning Types
export interface RouteRequest {
  from_station_id: number;
  to_station_id: number;
  departure_time: string;
  passenger_type_id: number;
  optimization: 'time' | 'cost' | 'transfers';
  max_walking_time?: number;
  max_transfers?: number;
}

export interface JourneySegment {
  segment_order: number;
  transport_type: 'train' | 'transfer' | 'walk';
  from_station_id: number;
  from_station_name: string;
  to_station_id: number;
  to_station_name: string;
  line_id?: number;
  line_name?: string;
  line_color?: string;
  duration_minutes: number;
  distance_km?: number;
  cost: string;
  departure_time: string;
  arrival_time: string;
  instructions: string;
  platform_info?: string;
}

export interface PlannedRoute {
  route_id: string;
  segments: JourneySegment[];
  summary: RouteSummary;
  optimization_score: number;
  carbon_footprint_kg?: number;
}

export interface RouteSummary {
  total_duration_minutes: number;
  total_cost: string;
  total_distance_km?: number;
  total_transfers: number;
  total_walking_time_minutes: number;
  departure_time: string;
  arrival_time: string;
  lines_used: string[];
}

// Schedule Types
export interface StationSchedule {
  station_id: number;
  current_time: string;
  departures: Departure[];
  service_status: 'normal' | 'delay' | 'disruption';
  alerts: ServiceAlert[];
  crowd_info?: CrowdInfo;
  weather_impact?: WeatherImpact;
}

export interface Departure {
  line_id: number;
  line_name: string;
  line_color?: string;
  destination: string;
  scheduled_time: string;
  estimated_time: string;
  delay_minutes: number;
  platform?: string;
  status: 'on_time' | 'delayed' | 'cancelled';
}

export interface ServiceAlert {
  id: number;
  title: string;
  description: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_lines: number[];
  affected_stations: number[];
  start_time: string;
  end_time?: string;
  is_active: boolean;
}

export interface CrowdInfo {
  level: 'low' | 'medium' | 'high' | 'very_high';
  description: string;
  last_updated: string;
}

export interface WeatherImpact {
  condition: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_services: string[];
}

// Admin Types
export interface AdminUser {
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

export interface AdminLoginRequest {
  username: string;
  password: string;
  totp_code?: string;
}

// Re-export for better compatibility
export type { AdminLoginRequest as AdminLoginRequestType };

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  admin_user: AdminUser;
  permissions: string[];
  requires_2fa: boolean;
}

// API Response Types
export interface StationsResponse {
  stations: Station[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// Additional Route Types for Frontend
export interface RouteSegment {
  segment_id: string;
  from_station: number;
  to_station: number;
  line_name: string;
  line_color?: string;
  departure_time: string;
  arrival_time: string;
  travel_time: number;
  fare: number;
  platform?: string;
}

export interface RouteResponse {
  segments: RouteSegment[];
  total_time: number;
  total_fare: number;
  total_distance?: number;
  transfers: number;
}

// Passenger Type
export interface PassengerType {
  id: number;
  name: string;
  discount_percentage: number;
  age_min?: number;
  age_max?: number;
}

export interface PassengerTypesResponse {
  passenger_types: PassengerType[];
}

// Form Types
export interface RouteSearchForm {
  fromStation: number | null;
  toStation: number | null;
  departureTime: string;
  optimization: 'time' | 'cost' | 'transfers';
  passengerTypeId: number;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AdminLoginForm {
  username: string;
  password: string;
  totpCode?: string;
}