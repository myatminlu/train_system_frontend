import { format, formatDistanceToNow, parseISO, addMinutes, isAfter, isBefore } from 'date-fns';

export const formatTime = (dateString: string): string => {
  return format(parseISO(dateString), 'HH:mm');
};

export const formatDateTime = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
};

export const formatDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM dd, yyyy');
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const getTimeUntilDeparture = (departureTime: string): string => {
  return formatDistanceToNow(parseISO(departureTime), { addSuffix: true });
};

export const getDelayStatus = (scheduledTime: string, estimatedTime: string) => {
  const scheduled = parseISO(scheduledTime);
  const estimated = parseISO(estimatedTime);
  const delayMinutes = Math.floor((estimated.getTime() - scheduled.getTime()) / (1000 * 60));
  
  if (delayMinutes <= 0) {
    return { status: 'on_time', delay: 0, message: 'On time' };
  } else if (delayMinutes <= 5) {
    return { status: 'slight_delay', delay: delayMinutes, message: `${delayMinutes} min late` };
  } else {
    return { status: 'delayed', delay: delayMinutes, message: `${delayMinutes} min late` };
  }
};

export const isValidDepartureTime = (departureTime: string): boolean => {
  const departure = parseISO(departureTime);
  const now = new Date();
  const oneHourFromNow = addMinutes(now, 60);
  
  return isAfter(departure, oneHourFromNow);
};

export const formatDateTimeForAPI = (date: Date): string => {
  return date.toISOString();
};