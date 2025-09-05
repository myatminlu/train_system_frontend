import React from 'react';
import { Clock, MapPin, ArrowRight, RefreshCw, DollarSign, Train, User } from 'lucide-react';
import Modal from '../common/Modal';
import { PlannedRoute, JourneySegment } from '../../types';
import { formatTime } from '../../utils/date';

interface RouteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: PlannedRoute | null;
  onBookRoute?: () => void;
}

const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  isOpen,
  onClose,
  route,
  onBookRoute
}) => {
  if (!route) return null;

  const getLineColorClass = (lineName: string) => {
    const lineColors: { [key: string]: string } = {
      'BTS Sukhumvit Line': 'border-train-green bg-train-green/10 text-train-green',
      'BTS Silom Line': 'border-train-blue bg-train-blue/10 text-train-blue',
      'MRT Blue Line': 'border-train-blue bg-train-blue/10 text-train-blue',
      'MRT Purple Line': 'border-train-purple bg-train-purple/10 text-train-purple',
      'ARL': 'border-train-red bg-train-red/10 text-train-red'
    };
    return lineColors[lineName] || 'border-gray-300 bg-gray-50 text-gray-700';
  };

  const getTransportIcon = (segment: JourneySegment) => {
    if (segment.transport_type === 'transfer') {
      return <User className="h-4 w-4" />;
    }
    return <Train className="h-4 w-4" />;
  };

  const renderSegment = (segment: JourneySegment, index: number) => {
    const isTransfer = segment.transport_type === 'transfer';
    const colorClass = isTransfer 
      ? 'border-orange-300 bg-orange-50 text-orange-700' 
      : getLineColorClass(segment.line_name || '');

    return (
      <div key={index} className="relative">
        {/* Connecting Line */}
        {index > 0 && (
          <div className="absolute -top-4 left-8 w-0.5 h-4 bg-gray-300"></div>
        )}
        
        <div className="flex items-start space-x-4 p-4 border-l-4 border-gray-200 bg-gray-50 rounded-r-lg">
          {/* Transport Icon */}
          <div className={`flex-shrink-0 p-2 rounded-full border ${colorClass}`}>
            {getTransportIcon(segment)}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Segment Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded border ${colorClass}`}>
                  {isTransfer ? 'Transfer' : segment.line_name}
                </span>
                <span className="text-sm text-gray-500">
                  {segment.duration_minutes} min
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                ฿{segment.cost}
              </div>
            </div>
            
            {/* Route Details */}
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-700">
                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                <span className="font-medium">{segment.from_station_name}</span>
                <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                <span className="font-medium">{segment.to_station_name}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatTime(segment.departure_time)} - {formatTime(segment.arrival_time)}</span>
              </div>
              
              {segment.instructions && (
                <div className="text-sm text-gray-600 italic">
                  {segment.instructions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Route Details">
      <div className="p-6">
        {/* Route Summary */}
        <div className="bg-gradient-to-r from-train-blue to-blue-600 text-white rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Journey Summary</h3>
            <div className="text-right">
              <div className="text-2xl font-bold">฿{route.summary.total_cost}</div>
              <div className="text-sm opacity-90">Total Fare</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-medium">{route.summary.total_duration_minutes}min</span>
              </div>
              <div className="text-xs opacity-75">Total Time</div>
            </div>
            
            <div>
              <div className="flex items-center justify-center mb-1">
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="font-medium">{route.summary.total_transfers}</span>
              </div>
              <div className="text-xs opacity-75">Transfers</div>
            </div>
            
            <div>
              <div className="flex items-center justify-center mb-1">
                <User className="h-4 w-4 mr-1" />
                <span className="font-medium">{route.summary.total_walking_time_minutes}min</span>
              </div>
              <div className="text-xs opacity-75">Walking</div>
            </div>
          </div>
        </div>

        {/* Departure and Arrival Times */}
        <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Departure</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatTime(route.summary.departure_time)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="h-px bg-gray-300 flex-1"></div>
            <Train className="h-5 w-5" />
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Arrival</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatTime(route.summary.arrival_time)}
            </div>
          </div>
        </div>

        {/* Route Segments */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wide">
            Journey Steps
          </h4>
          <div className="space-y-2">
            {route.segments.map((segment, index) => renderSegment(segment, index))}
          </div>
        </div>

        {/* Lines Used */}
        {route.summary.lines_used.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Lines Used</h4>
            <div className="flex flex-wrap gap-2">
              {route.summary.lines_used.map((line, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getLineColorClass(line)}`}
                >
                  {line}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-train-blue"
          >
            Close
          </button>
          
          {onBookRoute && (
            <button
              onClick={() => {
                onBookRoute();
                onClose();
              }}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
            >
              Book This Route
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RouteDetailsModal;