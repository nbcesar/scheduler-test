import React from 'react';
import { Check, X } from 'lucide-react';
import { TimeSlotGroup as TimeSlotGroupType, DayAvailability, Timezone } from '../types/scheduler';
import { DAYS } from '../constants/timeSlots';
import { formatTimeRange } from '../utils/timeUtils';

interface TimeSlotGroupProps {
  group: TimeSlotGroupType;
  timezone: Timezone;
  availability: Record<string, DayAvailability>;
  onToggle: (timeKey: string, day: string) => void;
  onToggleGroup: (slots: string[], value: boolean) => void;
}

export function TimeSlotGroup({ 
  group, 
  timezone,
  availability, 
  onToggle, 
  onToggleGroup 
}: TimeSlotGroupProps) {
  const timeKeys = group.slots.map(slot => slot.id);
  
  const isGroupFullySelected = timeKeys.every(timeKey =>
    DAYS.every(day => availability[timeKey]?.[day])
  );

  const handleGroupToggle = () => {
    onToggleGroup(timeKeys, !isGroupFullySelected);
  };

  return (
    <>
      <tr className="bg-gray-50">
        <td colSpan={5} className="px-2 py-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">{group.name}</span>
            <button
              onClick={handleGroupToggle}
              className="flex items-center px-2 py-1 text-xs rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {isGroupFullySelected ? (
                <>
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Select All
                </>
              )}
            </button>
          </div>
        </td>
      </tr>
      {group.slots.map((slot) => {
        return (
          <tr key={slot.id} className="border-b border-gray-200">
            <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">
              {formatTimeRange(slot.start, slot.end, timezone)}
            </td>
            {DAYS.map((day) => (
              <td key={day} className="px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={availability[slot.id]?.[day] || false}
                  onChange={() => onToggle(slot.id, day)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}