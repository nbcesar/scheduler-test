import React from 'react';
import { ScheduleEntry, Timezone } from '../types/scheduler';
import { formatTimeRange } from '../utils/timeUtils';
import scheduleData from '../constants/q1_schedule_no_prefix_military_time.json';
import { DAYS } from '../constants/timeSlots';

interface ScheduleGridProps {
  combo: string;
  timezone: Timezone;
}

const getCourseColors = (courseName: string) => {
  if (courseName.includes('Introduction to Business')) {
    return {
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      text: 'text-indigo-900',
      subtext: 'text-indigo-700'
    };
  }
  if (courseName.includes('English Composition')) {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-900',
      subtext: 'text-emerald-700'
    };
  }
  if (courseName.includes('Purpose Driven Life')) {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-900',
      subtext: 'text-amber-700'
    };
  }
  return {
    bg: 'bg-gray-50',
    border: 'border-gray-100',
    text: 'text-gray-900',
    subtext: 'text-gray-700'
  };
};

export function ScheduleGrid({ combo, timezone }: ScheduleGridProps) {
  const comboEntries = (scheduleData as ScheduleEntry[]).filter(entry => entry.Combo === combo);
  
  // Get unique time slots using a Map to ensure uniqueness
  const timeSlotMap = new Map();
  comboEntries.forEach(entry => {
    const key = `${entry["Start Time"]}-${entry["End Time"]}`;
    if (!timeSlotMap.has(key)) {
      timeSlotMap.set(key, {
        start: entry["Start Time"],
        end: entry["End Time"]
      });
    }
  });

  const uniqueTimeSlots = Array.from(timeSlotMap.values())
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-32">
              Time
            </th>
            {DAYS.map(day => (
              <th key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uniqueTimeSlots.map(timeSlot => {
            const timeRange = formatTimeRange(timeSlot.start, timeSlot.end, timezone);
            return (
              <tr key={`${timeSlot.start}-${timeSlot.end}`}>
                <td className="px-2 py-2">
                  <div className="text-xs text-gray-900">
                    {timeRange}
                  </div>
                </td>
                {DAYS.map(day => {
                  const entry = comboEntries.find(e => 
                    e.Day === day && 
                    e["Start Time"] === timeSlot.start && 
                    e["End Time"] === timeSlot.end
                  );
                  
                  if (!entry) return <td key={day} className="px-2 py-2" />;
                  
                  const colors = getCourseColors(entry["Course Name"]);
                  
                  return (
                    <td key={day} className="px-2 py-2">
                      <div className={`text-xs ${colors.bg} border ${colors.border} rounded p-2`}>
                        <div className={`font-medium ${colors.text}`}>
                          {entry["Course Name"].split('(')[0].trim()}
                        </div>
                        <div className={`mt-1 ${colors.subtext}`}>{entry.Type}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}