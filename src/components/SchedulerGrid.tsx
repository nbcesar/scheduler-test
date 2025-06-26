import React from 'react';
import { DayHeader } from './DayHeader';
import { TimeSlotGroup } from './TimeSlotGroup';
import { DAYS, TIME_SLOTS } from '../constants/timeSlots';
import { TimeAvailability, DayAvailability, Timezone } from '../types/scheduler';
import { X } from 'lucide-react';

interface SchedulerGridProps {
  availability: TimeAvailability;
  timezone: Timezone;
  onTimezoneChange?: (timezone: Timezone) => void;
  onAvailabilityChange: (availability: TimeAvailability) => void;
  showTimezoneSelector?: boolean;
}

export function SchedulerGrid({ 
  availability, 
  timezone,
  onTimezoneChange,
  onAvailabilityChange,
  showTimezoneSelector = true
}: SchedulerGridProps) {
  const handleToggle = (timeKey: string, day: string) => {
    onAvailabilityChange({
      ...availability,
      [timeKey]: {
        ...availability[timeKey],
        [day]: !availability[timeKey]?.[day]
      }
    });
  };

  const handleToggleGroup = (timeKeys: string[], value: boolean) => {
    const newAvailability = { ...availability };
    timeKeys.forEach(timeKey => {
      newAvailability[timeKey] = DAYS.reduce((acc, day) => {
        acc[day] = value;
        return acc;
      }, {} as DayAvailability);
    });
    onAvailabilityChange(newAvailability);
  };

  const handleClearAll = () => {
    onAvailabilityChange({});
  };

  const hasSelections = Object.keys(availability).some(timeKey => 
    Object.values(availability[timeKey]).some(value => value)
  );

  return (
    <div className="overflow-x-auto">
      {showTimezoneSelector && (
        <div className="px-2 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="timezone" className="text-sm font-medium text-gray-700">
                Timezone:
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => onTimezoneChange?.(e.target.value as Timezone)}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Eastern">Eastern Time</option>
                <option value="Central">Central Time</option>
                <option value="Mountain">Mountain Time</option>
                <option value="Pacific">Pacific Time</option>
              </select>
            </div>
            {hasSelections && (
              <button
                onClick={handleClearAll}
                className="flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All Selections
              </button>
            )}
          </div>
        </div>
      )}
      <table className="w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-2 py-3 w-28 text-left font-semibold text-gray-900 bg-gray-100">
              Time Slot
            </th>
            {DAYS.map(day => (
              <DayHeader key={day} day={day} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {TIME_SLOTS.map((group) => (
            <TimeSlotGroup
              key={group.name}
              group={group}
              timezone={timezone}
              availability={availability}
              onToggle={handleToggle}
              onToggleGroup={handleToggleGroup}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}