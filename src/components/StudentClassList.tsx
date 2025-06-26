import React, { useState } from 'react';
import { ClassEntry } from '../types/student-scheduler';
import { Plus, AlertTriangle, BookOpen, Clock, CheckCircle, XCircle, Clock as ClockIcon, Archive } from 'lucide-react';
import { formatTimeRange } from '../utils/timeUtils';
import { Timezone } from '../types/student-scheduler';

interface StudentClassListProps {
  availableClasses: ClassEntry[];
  conflictingClasses: ClassEntry[];
  timezone: Timezone;
  onSelectClass: (classEntry: ClassEntry) => void;
  showOnlyFilters?: boolean;
}

export function StudentClassList({ 
  availableClasses, 
  conflictingClasses, 
  timezone,
  onSelectClass,
  showOnlyFilters = false
}: StudentClassListProps) {
  const [showConflicting, setShowConflicting] = useState(false);

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

  const getConflictReason = (classEntry: ClassEntry) => {
    const hasSameCourseInAvailable = availableClasses.some(c => c["Course Code"] === classEntry["Course Code"]);
    
    if (!hasSameCourseInAvailable) {
      return 'Same course already selected';
    }
    return 'Time conflict with selected classes';
  };

  const getGradeIcon = (grade: string, status: string) => {
    if (status === 'In Progress') {
      return <ClockIcon className="w-3 h-3 text-blue-500" />;
    }
    if (status === 'Passed') {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    return <XCircle className="w-3 h-3 text-red-500" />;
  };

  const getGradeColor = (grade: string, status: string) => {
    if (status === 'In Progress') {
      return 'text-blue-600 bg-blue-100';
    }
    if (status === 'Passed') {
      return 'text-green-600 bg-green-100';
    }
    return 'text-red-600 bg-red-100';
  };

  // Create unique key for each class entry
  const getClassKey = (classEntry: ClassEntry, prefix: string = '') => {
    return `${prefix}${classEntry["Course Code"]}-${classEntry["Section Code"]}`;
  };

  const ClassCard = ({ classEntry, isConflicting = false }: { classEntry: ClassEntry; isConflicting?: boolean }) => {
    const conflictReason = isConflicting ? getConflictReason(classEntry) : '';
    const isSameCourseConflict = conflictReason === 'Same course already selected';
    
    return (
      <div className={`border rounded-lg p-3 ${isConflicting ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:border-purple-300'} transition-colors`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 text-sm">
                {classEntry["Course Name"].trim()}
              </h3>
              <span className="text-xs text-gray-500">
                Sec {classEntry["Section Code"]}
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
              className="ml-4 p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // If showing only filters, return empty div since we removed filters
  if (showOnlyFilters) {
    return <div />;
  }

  return (
    <div>
      {/* Available Classes */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {availableClasses.length > 0 ? (
          availableClasses.map((classEntry) => (
            <ClassCard 
              key={getClassKey(classEntry, 'available-')}
              classEntry={classEntry}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No classes available for this student.
          </div>
        )}
      </div>

      {/* Conflicting Classes */}
      {conflictingClasses.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowConflicting(!showConflicting)}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 mb-3"
          >
            <AlertTriangle className="w-4 h-4" />
            Unavailable Classes ({conflictingClasses.length})
            <span className="text-xs">
              {showConflicting ? '▼' : '▶'}
            </span>
          </button>
          
          {showConflicting && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {conflictingClasses.map((classEntry) => (
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