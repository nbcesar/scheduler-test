import React, { useState } from 'react';
import { ClassEntry } from '../types/custom-scheduler';
import { Plus, AlertTriangle, BookOpen, Clock } from 'lucide-react';
import { formatTimeRange, normalizeTimeSlot, sortTimeSlots } from '../utils/timeUtils';
import { Timezone } from '../types/custom-scheduler';

interface CustomClassListProps {
  availableClasses: ClassEntry[];
  conflictingClasses: ClassEntry[];
  timezone: Timezone;
  onSelectClass: (classEntry: ClassEntry) => void;
}

export function CustomClassList({ availableClasses, conflictingClasses, timezone, onSelectClass }: CustomClassListProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set());
  const [showConflicting, setShowConflicting] = useState(false);

  // Get unique courses with their names from both available and conflicting classes
  const uniqueCourses = Array.from(
    new Map([...availableClasses, ...conflictingClasses].map(c => [
      c["Course Code"], 
      { code: c["Course Code"], name: c["Course Name"].trim() }
    ])).values()
  ).sort((a, b) => a.code.localeCompare(b.code));

  // Get unique normalized time slots with proper ordering
  const uniqueTimeSlots = sortTimeSlots(
    Array.from(
      new Set([...availableClasses, ...conflictingClasses].map(c => normalizeTimeSlot(c["Time Slot"])))
    )
  );

  // Filter classes based on selected courses and time slots
  const filteredAvailable = availableClasses.filter(c => {
    const courseMatch = selectedCourses.size === 0 || selectedCourses.has(c["Course Code"]);
    const timeSlotMatch = selectedTimeSlots.size === 0 || selectedTimeSlots.has(normalizeTimeSlot(c["Time Slot"]));
    return courseMatch && timeSlotMatch;
  });

  const filteredConflicting = conflictingClasses.filter(c => {
    const courseMatch = selectedCourses.size === 0 || selectedCourses.has(c["Course Code"]);
    const timeSlotMatch = selectedTimeSlots.size === 0 || selectedTimeSlots.has(normalizeTimeSlot(c["Time Slot"]));
    return courseMatch && timeSlotMatch;
  });

  const handleCourseToggle = (courseCode: string) => {
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseCode)) {
        newSet.delete(courseCode);
      } else {
        newSet.add(courseCode);
      }
      return newSet;
    });
  };

  const handleTimeSlotToggle = (timeSlot: string) => {
    setSelectedTimeSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(timeSlot)) {
        newSet.delete(timeSlot);
      } else {
        newSet.add(timeSlot);
      }
      return newSet;
    });
  };

  const handleSelectAllCourses = () => {
    if (selectedCourses.size === uniqueCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(uniqueCourses.map(c => c.code)));
    }
  };

  const handleSelectAllTimeSlots = () => {
    if (selectedTimeSlots.size === uniqueTimeSlots.length) {
      setSelectedTimeSlots(new Set());
    } else {
      setSelectedTimeSlots(new Set(uniqueTimeSlots));
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    
    const parts = time.split(' - ');
    
    if (parts.length === 2) {
      return formatTimeRange(parts[0], parts[1], timezone);
    } else if (parts.length === 1) {
      // Single time, just convert it
      const [hours, minutes] = parts[0].split(':');
      let hourNum = parseInt(hours);
      
      // Handle 24:00 as midnight (12:00 AM next day)
      if (hourNum === 24) {
        hourNum = 0;
      }
      
      const period = hourNum >= 12 ? 'PM' : 'AM';
      let displayHour = hourNum;
      
      if (hourNum > 12) {
        displayHour = hourNum - 12;
      } else if (hourNum === 0) {
        displayHour = 12;
      }
      
      return `${displayHour}:${minutes} ${period}`;
    }
    
    return time; // fallback to original time if format is unexpected
  };

  // Determine conflict reason
  const getConflictReason = (classEntry: ClassEntry) => {
    // Check if it's a same course code conflict by looking at available classes
    // If the course code exists in available classes, then this conflicting class
    // is likely conflicting due to time, not course code
    const hasSameCourseInAvailable = availableClasses.some(c => c["Course Code"] === classEntry["Course Code"]);
    
    if (!hasSameCourseInAvailable) {
      return 'Same course already selected';
    }
    return 'Time conflict with selected classes';
  };

  // Create unique key for each class entry
  const getClassKey = (classEntry: ClassEntry, prefix: string = '') => {
    return `${prefix}${classEntry["Course Code"]}-${classEntry["Section Code"]}`;
  };

  const ClassCard = ({ classEntry, isConflicting = false }: { classEntry: ClassEntry; isConflicting?: boolean }) => {
    const conflictReason = isConflicting ? getConflictReason(classEntry) : '';
    const isSameCourseConflict = conflictReason === 'Same course already selected';
    
    return (
      <div className={`border rounded-lg p-3 ${isConflicting ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-green-300'} transition-colors`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 text-sm">
                {classEntry["Course Name"].trim()}
              </h3>
              <span className="text-xs text-gray-500">
                Sec {classEntry["Section Code"]}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
                {normalizeTimeSlot(classEntry["Time Slot"])}
              </span>
              {isConflicting && (
                isSameCourseConflict ? (
                  <BookOpen className="w-3 h-3 text-orange-500" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                )
              )}
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Lecture:</span> {classEntry["Lecture Day 1"]}{classEntry["Lecture Day 2"] && `, ${classEntry["Lecture Day 2"]}`} {formatTime(classEntry["Lecture Time"])}
              </div>
              
              {classEntry["DS Day"] && classEntry["DS Time"] && (
                <div>
                  <span className="font-medium">Discussion:</span> {classEntry["DS Day"]} {formatTime(classEntry["DS Time"])}
                </div>
              )}
            </div>
          </div>
          
          {!isConflicting && (
            <button
              onClick={() => onSelectClass(classEntry)}
              className="ml-3 flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>
        
        {isConflicting && (
          <div className={`mt-2 text-xs rounded px-2 py-1 ${
            isSameCourseConflict 
              ? 'text-orange-700 bg-orange-100' 
              : 'text-red-600 bg-red-100'
          }`}>
            {conflictReason}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Filters Section */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Course Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Filter by Course
              </h3>
              <button
                onClick={handleSelectAllCourses}
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                {selectedCourses.size === uniqueCourses.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {uniqueCourses.map(course => (
                <label
                  key={course.code}
                  className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.has(course.code)}
                    onChange={() => handleCourseToggle(course.code)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{course.code}</div>
                    <div className="text-xs text-gray-600 truncate">{course.name}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedCourses.size > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  {selectedCourses.size} course{selectedCourses.size !== 1 ? 's' : ''} selected
                </div>
              </div>
            )}
          </div>

          {/* Time Slot Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Filter by Time Slot
              </h3>
              <button
                onClick={handleSelectAllTimeSlots}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedTimeSlots.size === uniqueTimeSlots.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {uniqueTimeSlots.map(timeSlot => (
                <label
                  key={timeSlot}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTimeSlots.has(timeSlot)}
                    onChange={() => handleTimeSlotToggle(timeSlot)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-sm text-gray-900 capitalize">{timeSlot}</div>
                </label>
              ))}
            </div>
            {selectedTimeSlots.size > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  {selectedTimeSlots.size} time slot{selectedTimeSlots.size !== 1 ? 's' : ''} selected
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Classes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Available Classes</h2>
        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {filteredAvailable.length} class{filteredAvailable.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAvailable.length > 0 ? (
          filteredAvailable.map((classEntry) => (
            <ClassCard 
              key={getClassKey(classEntry, 'available-')}
              classEntry={classEntry}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {selectedCourses.size === 0 && selectedTimeSlots.size === 0
              ? 'No classes available.' 
              : 'No available classes match the selected filters.'
            }
          </div>
        )}
      </div>

      {filteredConflicting.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowConflicting(!showConflicting)}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 mb-3"
          >
            <AlertTriangle className="w-4 h-4" />
            Unavailable Classes ({filteredConflicting.length})
            <span className="text-xs">
              {showConflicting ? '▼' : '▶'}
            </span>
          </button>
          
          {showConflicting && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredConflicting.map((classEntry) => (
                <ClassCard 
                  key={getClassKey(classEntry, 'conflict-')}
                  classEntry={classEntry}
                  isConflicting={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}