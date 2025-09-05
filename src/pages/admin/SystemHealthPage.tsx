import React, { useState, useEffect } from 'react';
import { 
  Server, Database, Activity, AlertCircle, CheckCircle, RefreshCw, 
  Zap, HardDrive, Gauge, Bell, X, Clock, TrendingUp
} from 'lucide-react';
import { adminService } from '../../services/api';
import { format } from 'date-fns';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  components: {
    [key: string]: {
      status: 'healthy' | 'warning' | 'critical';
      response_time?: number;
      last_check: string;
      message?: string;
    };
  };
}

interface Performance {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time: number;
  requests_per_minute: number;
  active_connections: number;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  is_active: boolean;
  component?: string;
}

const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadSystemData = async () => {
    try {
      const [healthData, perfData, alertsData] = await Promise.allSettled([
        adminService.getSystemHealth(),
        adminService.getCurrentPerformance(),
        adminService.getSystemAlerts(true),
      ]);

      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value || {
          status: 'healthy',
          uptime: 0,
          components: {},
        });
      }

      if (perfData.status === 'fulfilled') {
        setPerformance(perfData.value || {
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 0,
          response_time: 0,
          requests_per_minute: 0,
          active_connections: 0,
        });
      }

      if (alertsData.status === 'fulfilled') {
        setAlerts(alertsData.value?.alerts || []);
      }

    } catch (err: any) {
      console.error('Failed to load system data:', err);
      setError('Failed to load system data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();
    
    const interval = autoRefresh 
      ? setInterval(loadSystemData, 30000) // Refresh every 30 seconds
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const resolveAlert = async (alertId: string) => {
    try {
      await adminService.resolveAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      setError('Failed to resolve alert. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-2">
            Monitor system performance and component health
          </p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          <button
            onClick={loadSystemData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full border-2 ${getStatusColor(health?.status || 'healthy')}`}>
              <Server className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                System Status: <span className="capitalize">{health?.status || 'Unknown'}</span>
              </h2>
              <p className="text-gray-600">
                Uptime: {health?.uptime ? formatUptime(health.uptime) : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-lg font-semibold text-gray-900">
              {format(new Date(), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">CPU Usage</h3>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {performance?.cpu_usage || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                (performance?.cpu_usage || 0) > 80 
                  ? 'bg-red-500' 
                  : (performance?.cpu_usage || 0) > 60 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(performance?.cpu_usage || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Memory Usage</h3>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {performance?.memory_usage || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                (performance?.memory_usage || 0) > 80 
                  ? 'bg-red-500' 
                  : (performance?.memory_usage || 0) > 60 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(performance?.memory_usage || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Disk Usage</h3>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {performance?.disk_usage || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                (performance?.disk_usage || 0) > 80 
                  ? 'bg-red-500' 
                  : (performance?.disk_usage || 0) > 60 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(performance?.disk_usage || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">Response Time</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {performance?.response_time || 0}ms
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">Requests/Min</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {performance?.requests_per_minute || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">Active Connections</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {performance?.active_connections || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Component Health</h2>
        </div>
        <div className="p-6">
          {health?.components && Object.keys(health.components).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(health.components).map(([component, data]) => (
                <div key={component} className={`p-4 rounded-lg border ${getStatusColor(data.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {data.status === 'healthy' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      <div>
                        <h3 className="font-medium capitalize">
                          {component.replace('_', ' ')}
                        </h3>
                        {data.message && (
                          <p className="text-sm opacity-75">{data.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium capitalize">
                        {data.status}
                      </span>
                      {data.response_time && (
                        <p className="text-xs opacity-75">
                          {data.response_time}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No component data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {alerts.filter(alert => alert.is_active).length} Active
            </span>
          </div>
        </div>
        <div className="p-6">
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.filter(alert => alert.is_active).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Bell className="h-5 w-5 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{alert.title}</h3>
                        <p className="text-sm opacity-75 mt-1">{alert.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs opacity-60">
                          <span>Severity: {alert.severity}</span>
                          <span>Created: {format(new Date(alert.created_at), 'MMM dd, HH:mm')}</span>
                          {alert.component && <span>Component: {alert.component}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">No active alerts</p>
              <p className="text-sm text-gray-400 mt-1">System is running smoothly</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;