import React, { useState } from 'react';
import { ScheduleEntry, TimeAvailability, Timezone } from '../types/scheduler';
import { formatTimeRange } from '../utils/timeUtils';
import scheduleData from '../constants/q1_schedule_no_prefix_military_time.json';
import { TIME_SLOTS } from '../constants/timeSlots';
import { ScheduleGrid } from './ScheduleGrid';
import { ChevronDown, ChevronUp } from 'lucide-react';

type FoundationsFilter = 'any' | 'foundations' | 'non-foundations';

interface ScheduleListProps {
  availability: TimeAvailability;
  timezone: Timezone;
}

export function ScheduleList({ availability, timezone }: ScheduleListProps) {
  const [collapsedCombos, setCollapsedCombos] = useState<Set<string>>(new Set());
  const [foundationsFilter, setFoundationsFilter] = useState<FoundationsFilter>('any');

  const isTimeSlotAvailable = (day: string, startTime: string, endTime: string) => {
    const matchingSlots = TIME_SLOTS.flatMap(group => 
      group.slots.filter(slot => 
        slot.start === startTime && slot.end === endTime
      )
    );
    return matchingSlots.some(slot => availability[slot.id]?.[day] ?? false);
  };

  const isFoundationsCombo = (combo: string): boolean => {
    const entries = (scheduleData as ScheduleEntry[]).filter(entry => entry.Combo === combo);
    return entries.some(entry => entry.Foundations === "TRUE");
  };

  const getAvailableCombos = () => {
    const entries = scheduleData as ScheduleEntry[];
    const combos = new Set<string>();
    const unavailableCombos = new Set<string>();

    entries.forEach(entry => {
      if (!isTimeSlotAvailable(entry.Day, entry["Start Time"], entry["End Time"])) {
        unavailableCombos.add(entry.Combo);
      }
    });

    entries.forEach(entry => {
      if (!unavailableCombos.has(entry.Combo)) {
        const isFoundations = isFoundationsCombo(entry.Combo);
        if (
          foundationsFilter === 'any' ||
          (foundationsFilter === 'foundations' && isFoundations) ||
          (foundationsFilter === 'non-foundations' && !isFoundations)
        ) {
          combos.add(entry.Combo);
        }
      }
    });

    return Array.from(combos).sort((a, b) => {
      const letterA = a.charAt(0);
      const letterB = b.charAt(0);
      if (letterA !== letterB) return letterA.localeCompare(letterB);
      
      const numA = parseInt(a.slice(1));
      const numB = parseInt(b.slice(1));
      return numA - numB;
    });
  };

  const toggleCombo = (combo: string) => {
    setCollapsedCombos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(combo)) {
        newSet.delete(combo);
      } else {
        newSet.add(combo);
      }
      return newSet;
    });
  };

  const availableCombos = getAvailableCombos();

  // Group combos by letter
  const groupedCombos = availableCombos.reduce((acc, combo) => {
    const letter = combo.charAt(0);
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(combo);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Available Schedules</h2>
        <div className="flex items-center gap-2">
          <select
            value={foundationsFilter}
            onChange={(e) => setFoundationsFilter(e.target.value as FoundationsFilter)}
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="any">All Courses</option>
            <option value="foundations">Foundations Only</option>
            <option value="non-foundations">Non-Foundations Only</option>
          </select>
          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {availableCombos.length} combination{availableCombos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {Object.keys(availability).length === 0 || availableCombos.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            No schedule combinations available. Please select your available time slots.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {Object.entries(groupedCombos).map(([letter, combos], groupIndex) => (
            <div key={letter} className={groupIndex > 0 ? 'border-t-4 border-gray-100' : ''}>
              <div className="bg-gray-50 px-3 py-2">
                <h3 className="text-sm font-medium text-gray-500">Group {letter}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {combos.map(combo => (
                  <div key={combo} className="hover:bg-gray-50">
                    <button
                      onClick={() => toggleCombo(combo)}
                      className="w-full p-3 text-left flex items-center justify-between"
                    >
                      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        Schedule {combo}
                        {isFoundationsCombo(combo) && (
                          <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Foundations
                          </span>
                        )}
                      </h3>
                      {collapsedCombos.has(combo) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    {!collapsedCombos.has(combo) && (
                      <div className="px-3 pb-3">
                        <ScheduleGrid combo={combo} timezone={timezone} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}