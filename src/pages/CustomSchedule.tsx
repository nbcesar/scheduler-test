import React, { useState, useMemo } from 'react';
import { Calendar, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomScheduleGrid } from '../components/CustomScheduleGrid';
import { CustomClassList } from '../components/CustomClassList';
import { ClassEntry, SelectedClass, Timezone } from '../types/custom-scheduler';
import classListData from '../constants/class_list.json';

export function CustomSchedule() {
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>([]);
  const [timezone, setTimezone] = useState<Timezone>('Eastern');

  const classList = classListData as ClassEntry[];

  // Check if two time ranges conflict
  const timeRangesConflict = (time1: string, time2: string): boolean => {
    if (!time1 || !time2) return false;
    
    const parseTime = (timeRange: string) => {
      const [start, end] = timeRange.split(' - ');
      const parseHour = (time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        return hour * 60 + minute;
      };
      return {
        start: parseHour(start),
        end: parseHour(end)
      };
    };

    const range1 = parseTime(time1);
    const range2 = parseTime(time2);

    return range1.start < range2.end && range2.start < range1.end;
  };

  // Check if a class conflicts with selected classes
  const hasConflict = (classEntry: ClassEntry): boolean => {
    return selectedClasses.some(selected => {
      // Check lecture conflicts
      const lectureDays1 = [classEntry["Lecture Day 1"], classEntry["Lecture Day 2"]].filter(Boolean);
      const lectureDays2 = [selected.class["Lecture Day 1"], selected.class["Lecture Day 2"]].filter(Boolean);
      
      const lectureConflict = lectureDays1.some(day1 => 
        lectureDays2.some(day2 => 
          day1 === day2 && timeRangesConflict(classEntry["Lecture Time"], selected.class["Lecture Time"])
        )
      );

      // Check discussion section conflicts
      const dsConflict = classEntry["DS Day"] && selected.class["DS Day"] &&
        classEntry["DS Day"] === selected.class["DS Day"] &&
        timeRangesConflict(classEntry["DS Time"] || '', selected.class["DS Time"] || '');

      // Check lecture vs DS conflicts
      const lectureDsConflict = lectureDays1.some(lectureDay =>
        selected.class["DS Day"] === lectureDay &&
        timeRangesConflict(classEntry["Lecture Time"], selected.class["DS Time"] || '')
      ) || (classEntry["DS Day"] && lectureDays2.some(lectureDay =>
        classEntry["DS Day"] === lectureDay &&
        timeRangesConflict(classEntry["DS Time"] || '', selected.class["Lecture Time"])
      ));

      return lectureConflict || dsConflict || lectureDsConflict;
    });
  };

  // Check if a class has the same course code as any selected class
  const hasSameCourseCode = (classEntry: ClassEntry): boolean => {
    return selectedClasses.some(selected => selected.class["Course Code"] === classEntry["Course Code"]);
  };

  const { availableClasses, conflictingClasses } = useMemo(() => {
    const available: ClassEntry[] = [];
    const conflicting: ClassEntry[] = [];

    classList.forEach(classEntry => {
      // Skip if already selected
      if (selectedClasses.some(selected => selected.class["Section Code"] === classEntry["Section Code"])) {
        return;
      }

      // Filter out classes with same course code as selected classes
      if (hasSameCourseCode(classEntry)) {
        conflicting.push(classEntry);
      } else if (hasConflict(classEntry)) {
        conflicting.push(classEntry);
      } else {
        available.push(classEntry);
      }
    });

    return { availableClasses: available, conflictingClasses: conflicting };
  }, [selectedClasses, classList]);

  const handleSelectClass = (classEntry: ClassEntry) => {
    const newSelected: SelectedClass = {
      id: `${classEntry["Course Code"]}-${classEntry["Section Code"]}`,
      class: classEntry
    };
    setSelectedClasses(prev => [...prev, newSelected]);
  };

  const handleUnselectClass = (classId: string) => {
    setSelectedClasses(prev => prev.filter(selected => selected.id !== classId));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Custom Schedule Builder</h1>
          </div>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to terms
          </Link>
        </div>

        {selectedClasses.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Selected Classes</h2>
            <div className="flex flex-wrap gap-2">
              {selectedClasses.map(selected => (
                <div
                  key={selected.id}
                  className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-1"
                >
                  <span className="text-sm font-medium text-green-900">
                    {selected.class["Course Code"]} - Section {selected.class["Section Code"]}
                  </span>
                  <button
                    onClick={() => handleUnselectClass(selected.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CustomScheduleGrid 
              selectedClasses={selectedClasses}
              timezone={timezone}
              onTimezoneChange={setTimezone}
            />
          </div>
          <div>
            <CustomClassList
              availableClasses={availableClasses}
              conflictingClasses={conflictingClasses}
              timezone={timezone}
              onSelectClass={handleSelectClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}