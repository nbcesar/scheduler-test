import React from 'react';
import { SelectedClass, Timezone } from '../types/custom-scheduler';
import { formatTimeRange } from '../utils/timeUtils';

interface CustomScheduleGridProps {
  selectedClasses: SelectedClass[];
  timezone: Timezone;
  onTimezoneChange: (timezone: Timezone) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];

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

export function CustomScheduleGrid({ selectedClasses, timezone, onTimezoneChange }: CustomScheduleGridProps) {
  // Create schedule entries from selected classes
  const scheduleEntries = selectedClasses.flatMap(selected => {
    const entries = [];
    const classEntry = selected.class;

    // Add lecture entries
    if (classEntry["Lecture Day 1"]) {
      entries.push({
        day: classEntry["Lecture Day 1"],
        time: classEntry["Lecture Time"],
        type: 'Lecture',
        courseName: classEntry["Course Name"],
        sectionCode: classEntry["Section Code"]
      });
    }
    if (classEntry["Lecture Day 2"]) {
      entries.push({
        day: classEntry["Lecture Day 2"],
        time: classEntry["Lecture Time"],
        type: 'Lecture',
        courseName: classEntry["Course Name"],
        sectionCode: classEntry["Section Code"]
      });
    }

    // Add discussion section entry
    if (classEntry["DS Day"] && classEntry["DS Time"]) {
      entries.push({
        day: classEntry["DS Day"],
        time: classEntry["DS Time"],
        type: 'Discussion',
        courseName: classEntry["Course Name"],
        sectionCode: classEntry["Section Code"]
      });
    }

    return entries;
  });

  // Get unique time slots
  const uniqueTimeSlots = Array.from(new Set(scheduleEntries.map(entry => entry.time)))
    .sort((a, b) => {
      const getMinutes = (time: string) => {
        const [start] = time.split(' - ');
        const [hours, minutes] = start.split(':').map(Number);
        return hours * 60 + minutes;
      };
      return getMinutes(a) - getMinutes(b);
    });

  return (
    <div className="overflow-x-auto">
      <div className="px-2 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="timezone" className="text-sm font-medium text-gray-700">
              Timezone:
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value as Timezone)}
              className="text-sm rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="Eastern">Eastern Time</option>
              <option value="Central">Central Time</option>
              <option value="Mountain">Mountain Time</option>
              <option value="Pacific">Pacific Time</option>
            </select>
          </div>
        </div>
      </div>
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
          {uniqueTimeSlots.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-2 py-8 text-center text-gray-500">
                No classes selected. Choose classes from the list to see your schedule.
              </td>
            </tr>
          ) : (
            uniqueTimeSlots.map(timeSlot => {
              const timeRange = formatTimeRange(
                timeSlot.split(' - ')[0],
                timeSlot.split(' - ')[1],
                timezone
              );
              return (
                <tr key={timeSlot}>
                  <td className="px-2 py-2">
                    <div className="text-xs text-gray-900">
                      {timeRange}
                    </div>
                  </td>
                  {DAYS.map(day => {
                    const entry = scheduleEntries.find(e => 
                      e.day === day && e.time === timeSlot
                    );
                    
                    if (!entry) return <td key={day} className="px-2 py-2" />;
                    
                    const colors = getCourseColors(entry.courseName);
                    
                    return (
                      <td key={day} className="px-2 py-2">
                        <div className={`text-xs ${colors.bg} border ${colors.border} rounded p-2`}>
                          <div className={`font-medium ${colors.text}`}>
                            {entry.courseName.split('(')[0].trim()}
                          </div>
                          <div className={`mt-1 ${colors.subtext}`}>
                            {entry.type} - Sec {entry.sectionCode}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}