import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { stationService, routeService } from '../services/api';
import { Station, RouteSearchForm } from '../types';
import { formatTime, formatDuration } from '../utils/date';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchForm, setSearchForm] = useState<RouteSearchForm>({
    fromStation: null,
    toStation: null,
    departureTime: new Date().toISOString().slice(0, 16),
    optimization: 'time',
    passengerTypeId: 1
  });

  useEffect(() => {
    const loadStations = async () => {
      try {
        const response = await stationService.getAllStations();
        setStations(response.stations);
      } catch (error) {
        console.error('Failed to load stations:', error);
      }
    };
    loadStations();
  }, []);

  const handlePlanRoute = async () => {
    if (!searchForm.fromStation || !searchForm.toStation) {
      alert('Please select both departure and arrival stations');
      return;
    }

    if (isAuthenticated) {
      navigate('/dashboard', { state: { searchForm } });
    } else {
      navigate('/login', { state: { redirectTo: '/dashboard', searchForm } });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-train-blue to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Plan Your Journey
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Navigate Bangkok's train network with ease
            </p>
          </div>

          {/* Route Search Card */}
          <div className="max-w-4xl mx-auto">
            <div className="card bg-white/95 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-6">
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

              <div className="mt-8 text-center">
                <button
                  onClick={handlePlanRoute}
                  disabled={!searchForm.fromStation || !searchForm.toStation || isLoading}
                  className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Planning Route...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Search className="h-5 w-5" />
                      <span>Plan My Journey</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Bangkok Trains?
            </h2>
            <p className="text-xl text-gray-600">
              The most comprehensive train navigation system in Bangkok
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-train-blue/10 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-12 w-12 text-train-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Route Planning</h3>
              <p className="text-gray-600">
                Find the optimal route with real-time schedules and transfer information
              </p>
            </div>

            <div className="text-center">
              <div className="bg-train-green/10 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-12 w-12 text-train-green" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">
                Get live departure times, delays, and service disruptions
              </p>
            </div>

            <div className="text-center">
              <div className="bg-train-orange/10 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-train-orange" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Coverage</h3>
              <p className="text-gray-600">
                All BTS, MRT, and Airport Rail Link stations in one platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Create an account to save favorite routes and get personalized recommendations
            </p>
            <div className="space-x-4">
              <Link to="/register" className="btn-primary px-6 py-3 text-lg">
                Create Account
              </Link>
              <Link to="/login" className="btn-secondary px-6 py-3 text-lg">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;