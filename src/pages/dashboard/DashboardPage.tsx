import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ArrowRight, Route, Zap, DollarSign, RefreshCw, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { stationService, routeService } from '../../services/api';
import { Station, RouteSearchForm, PlannedRoute, JourneySegment, PassengerType } from '../../types';
import { formatTime, formatDuration } from '../../utils/date';
import RouteDetailsModal from '../../components/route/RouteDetailsModal';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [passengerTypes, setPassengerTypes] = useState<PassengerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [isLoadingPassengerTypes, setIsLoadingPassengerTypes] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<PlannedRoute | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  
  const [searchForm, setSearchForm] = useState<RouteSearchForm>(() => {
    const stateSearchForm = location.state?.searchForm;
    return stateSearchForm || {
      fromStation: null,
      toStation: null,
      departureTime: new Date().toISOString().slice(0, 16),
      optimization: 'time',
      passengerTypeId: 1
    };
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingStations(true);
        setIsLoadingPassengerTypes(true);
        
        // Load stations and passenger types in parallel
        const [stationsResponse, passengerTypesResponse] = await Promise.all([
          stationService.getAllStations(),
          routeService.getPassengerTypes()
        ]);
        
        setStations(stationsResponse.stations);
        setPassengerTypes(passengerTypesResponse.passenger_types);
        
        // If we have search form data from navigation, trigger search automatically
        if (location.state?.searchForm) {
          await handleSearch();
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        error('Failed to load data. Please refresh the page.');
      } finally {
        setIsLoadingStations(false);
        setIsLoadingPassengerTypes(false);
      }
    };
    
    loadData();
  }, []);

  const handleSearch = async () => {
    if (!searchForm.fromStation || !searchForm.toStation) {
      error('Please select both departure and arrival stations');
      return;
    }

    if (searchForm.fromStation === searchForm.toStation) {
      error('Departure and arrival stations must be different');
      return;
    }

    setIsLoading(true);
    setSearchError('');
    setRoutes([]);

    try {
      const response = await routeService.searchRoutes(
        searchForm.fromStation,
        searchForm.toStation,
        searchForm.departureTime,
        searchForm.optimization,
        searchForm.passengerTypeId
      );
      setRoutes(response.routes);
      if (response.routes.length > 0) {
        success(`Found ${response.routes.length} route${response.routes.length > 1 ? 's' : ''} for your journey`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to find routes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOptimizationIcon = (optimization: string) => {
    switch (optimization) {
      case 'time':
        return <Zap className="h-4 w-4" />;
      case 'cost':
        return <DollarSign className="h-4 w-4" />;
      case 'transfers':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Route className="h-4 w-4" />;
    }
  };

  const getOptimizationLabel = (optimization: string) => {
    switch (optimization) {
      case 'time':
        return 'Fastest Route';
      case 'cost':
        return 'Cheapest Route';
      case 'transfers':
        return 'Fewest Transfers';
      default:
        return 'Optimized Route';
    }
  };

  const getStationName = (stationId: number) => {
    const station = stations.find(s => s.id === stationId);
    return station?.name || `Station ${stationId}`;
  };

  const handleViewRouteDetails = (route: PlannedRoute) => {
    setSelectedRoute(route);
    setShowRouteDetails(true);
  };

  const handleBookRoute = () => {
    // TODO: Implement booking flow
    success('Booking flow will be implemented soon!');
  };

  const renderRouteSegment = (segment: JourneySegment, index: number) => {
    const lineColors: { [key: string]: string } = {
      'BTS Sukhumvit Line': 'text-train-green bg-train-green/10',
      'BTS Silom Line': 'text-train-blue bg-train-blue/10',
      'MRT Blue Line': 'text-train-blue bg-train-blue/10',
      'MRT Purple Line': 'text-train-purple bg-train-purple/10',
      'ARL': 'text-train-red bg-train-red/10'
    };

    const lineColor = lineColors[segment.line_name || ''] || 'text-gray-600 bg-gray-100';

    return (
      <div key={index} className="flex items-center space-x-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${lineColor}`}>
          {segment.line_name || segment.transport_type}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {segment.from_station_name} → {segment.to_station_name}
          </div>
          <div className="text-xs text-gray-500">
            {formatTime(segment.departure_time)} - {formatTime(segment.arrival_time)} • {segment.duration_minutes}min
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">฿{segment.cost}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-lg text-gray-600">Plan your journey across Bangkok's train network</p>
      </div>

      {/* Search Form */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Route Planner</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline-block h-4 w-4 mr-1" />
              From Station
            </label>
            <select
              className="input-field"
              value={searchForm.fromStation || ''}
              onChange={(e) => setSearchForm(prev => ({ 
                ...prev, 
                fromStation: e.target.value ? parseInt(e.target.value) : null 
              }))}
              disabled={isLoadingStations}
            >
              <option value="">Select departure station</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline-block h-4 w-4 mr-1" />
              To Station
            </label>
            <select
              className="input-field"
              value={searchForm.toStation || ''}
              onChange={(e) => setSearchForm(prev => ({ 
                ...prev, 
                toStation: e.target.value ? parseInt(e.target.value) : null 
              }))}
              disabled={isLoadingStations}
            >
              <option value="">Select arrival station</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline-block h-4 w-4 mr-1" />
              Departure Time
            </label>
            <input
              type="datetime-local"
              className="input-field"
              value={searchForm.departureTime}
              onChange={(e) => setSearchForm(prev => ({ 
                ...prev, 
                departureTime: e.target.value 
              }))}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline-block h-4 w-4 mr-1" />
              Passenger Type
            </label>
            <select
              className="input-field"
              value={searchForm.passengerTypeId}
              onChange={(e) => setSearchForm(prev => ({ 
                ...prev, 
                passengerTypeId: parseInt(e.target.value) 
              }))}
              disabled={isLoadingPassengerTypes}
            >
              {passengerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.discount_percentage > 0 && `(${type.discount_percentage}% off)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimize For
            </label>
            <select
              className="input-field"
              value={searchForm.optimization}
              onChange={(e) => setSearchForm(prev => ({ 
                ...prev, 
                optimization: e.target.value as 'time' | 'cost' | 'transfers' 
              }))}
            >
              <option value="time">Fastest Route</option>
              <option value="cost">Cheapest Route</option>
              <option value="transfers">Fewest Transfers</option>
            </select>
          </div>
        </div>

        {searchError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{searchError}</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleSearch}
            disabled={!searchForm.fromStation || !searchForm.toStation || isLoading || isLoadingStations || isLoadingPassengerTypes}
            className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Searching Routes...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Find Routes</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Routes Results */}
      {routes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Found {routes.length} route{routes.length > 1 ? 's' : ''}
          </h2>
          
          {routes.map((route, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getOptimizationIcon(searchForm.optimization)}
                  <h3 className="font-semibold text-gray-900">
                    {getOptimizationLabel(searchForm.optimization)} #{index + 1}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">฿{route.summary.total_cost}</div>
                  <div className="text-sm text-gray-500">{route.summary.total_duration_minutes}min</div>
                </div>
              </div>

              <div className="space-y-3">
                {route.segments.map((segment, segIndex) => renderRouteSegment(segment, segIndex))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span>Total Travel Time: {route.summary.total_duration_minutes}min</span>
                    <span>Transfers: {route.summary.total_transfers}</span>
                    <span>Departure: {formatTime(route.summary.departure_time)}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewRouteDetails(route)}
                      className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={handleBookRoute}
                      className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No routes found */}
      {!isLoading && routes.length === 0 && searchForm.fromStation && searchForm.toStation && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or check if the stations are connected.
          </p>
        </div>
      )}

      {/* Loading states */}
      {(isLoadingStations || isLoadingPassengerTypes) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-train-blue mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading form data...</p>
        </div>
      )}

      {/* Route Details Modal */}
      <RouteDetailsModal
        isOpen={showRouteDetails}
        onClose={() => setShowRouteDetails(false)}
        route={selectedRoute}
        onBookRoute={handleBookRoute}
      />
    </div>
  );
};

export default DashboardPage;