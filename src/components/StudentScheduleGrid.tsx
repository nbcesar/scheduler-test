import React from 'react';
import { SelectedClass, Timezone } from '../types/student-scheduler';
import { formatTimeRange } from '../utils/timeUtils';

interface StudentScheduleGridProps {
  selectedClasses: SelectedClass[];
  timezone: Timezone;
  onTimezoneChange: (timezone: Timezone) => void;
  studentName: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];

// Color palette for classes based on selection order
const getClassColors = (index: number) => {
  const colors = [
    {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      subtext: 'text-blue-700'
    },
    {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      subtext: 'text-emerald-700'
    },
    {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      subtext: 'text-purple-700'
    },
    {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      subtext: 'text-amber-700'
    },
    {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      subtext: 'text-rose-700'
    },
    {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-900',
      subtext: 'text-cyan-700'
    },
    {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      subtext: 'text-indigo-700'
    },
    {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-900',
      subtext: 'text-teal-700'
    },
    {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      subtext: 'text-orange-700'
    },
    {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-900',
      subtext: 'text-pink-700'
    }
  ];
  
  // Cycle through colors if more than 10 classes
  return colors[index % colors.length];
};

export function StudentScheduleGrid({ selectedClasses, timezone, onTimezoneChange, studentName }: StudentScheduleGridProps) {
  // Create schedule entries from selected classes with color index
  const scheduleEntries = selectedClasses.flatMap((selected, classIndex) => {
    const entries = [];
    const classEntry = selected.class;

    // Add lecture entries
    if (classEntry["Lecture Day 1"]) {
      entries.push({
        day: classEntry["Lecture Day 1"],
        time: classEntry["Lecture Time"],
        type: 'Lecture',
        courseName: classEntry["Course Name"],
        sectionCode: classEntry["Section Code"],
        colorIndex: classIndex
      });
    }
    if (classEntry["Lecture Day 2"]) {
      entries.push({
        day: classEntry["Lecture Day 2"],
        time: classEntry["Lecture Time"],
        type: 'Lecture',
        courseName: classEntry["Course Name"],
        sectionCode: classEntry["Section Code"],
        colorIndex: classIndex
      });
    }

    // Add discussion section entry
    if (classEntry["DS Day"] && classEntry["DS Time"]) {
      entries.push({
        day: classEntry["DS Day"],
        time: classEntry["DS Time"],
        type: 'Discussion',
        courseName: classEntry["Course Name"],
        sectionCode: classEntry["Section Code"],
        colorIndex: classIndex
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
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead>
          <tr>
            <th className="w-40 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
              Time
            </th>
            {DAYS.map(day => (
              <th key={day} className="w-1/4 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {uniqueTimeSlots.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-2 py-8 text-center text-gray-500">
                No classes selected. Choose classes from the list to see {studentName}'s schedule.
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
                  <td className="w-40 px-2 py-2">
                    <div className="text-xs text-gray-900 whitespace-nowrap">
                      {timeRange}
                    </div>
                  </td>
                  {DAYS.map(day => {
                    const entry = scheduleEntries.find(e => 
                      e.day === day && e.time === timeSlot
                    );
                    
                    if (!entry) return <td key={day} className="w-1/4 px-1 py-1" />;
                    
                    const colors = getClassColors(entry.colorIndex);
                    
                    return (
                      <td key={day} className="w-1/4 px-1 py-1">
                        <div className={`text-xs ${colors.bg} border ${colors.border} rounded p-1 h-full`}>
                          <div 
                            className={`font-medium ${colors.text} truncate`}
                            style={{ lineHeight: 2.1 }}
                          >
                            {entry.courseName.split('(')[0].trim()}
                          </div>
                          <div 
                            className={`${colors.subtext} truncate`}
                            style={{ lineHeight: 2.1 }}  
                          >
                            {entry.type}
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