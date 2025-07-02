import React, { useState, useMemo, useRef } from 'react';
import { User, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudentScheduleGrid } from '../components/StudentScheduleGrid';
import { StudentClassList } from '../components/StudentClassList';
import { StudentSelector } from '../components/StudentSelector';
import { SchedulerGrid } from '../components/SchedulerGrid';
import { ClassEntry, SelectedClass, Timezone, TranscriptEntry, Student } from '../types/student-scheduler';
import { TimeAvailability } from '../types/scheduler';
import classListData from '../constants/class_list.json';
import transcriptsData from '../constants/transcripts.json';
import { StudentTranscript } from '../components/StudentTranscript';
import html2canvas from 'html2canvas';
import { ScheduleScreenshot } from '../components/ScheduleScreenshot';
import { ScheduleChangeRequest } from '../components/ScheduleChangeRequest';
import summerSchedulesData from '../constants/summer_schedules.json';

interface SummerScheduleEntry {
  student_id: string;
  section_code: string;
}

const summerSchedules = summerSchedulesData as SummerScheduleEntry[];

export function StudentSchedule() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>([]);
  const [timezone, setTimezone] = useState<Timezone>('Eastern');
  const [availability, setAvailability] = useState<TimeAvailability>({});
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [scheduledClasses, setScheduledClasses] = useState<SelectedClass[]>([]);

  const classList = classListData as ClassEntry[];
  const transcripts = transcriptsData as TranscriptEntry[];

  // Get unique students from transcripts with validation
  const students = useMemo(() => {
    const studentMap = new Map<string, Student>();
    transcripts.forEach(entry => {
      // Validate that student_id, student_name, and email are valid strings
      if (
        entry.student_id && 
        typeof entry.student_id === 'string' && 
        entry.student_id.trim() !== '' &&
        entry.student_name && 
        typeof entry.student_name === 'string' && 
        entry.student_name.trim() !== '' &&
        entry.email &&
        typeof entry.email === 'string' &&
        entry.email.trim() !== ''
      ) {
        const studentId = entry.student_id.trim();
        const studentName = entry.student_name.trim();
        const studentEmail = entry.email.trim();
        
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name: studentName,
            email: studentEmail
          });
        }
      }
    });
    return Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [transcripts]);

  // Get student's transcript entries
  const studentTranscripts = useMemo(() => {
    if (!selectedStudent) return [];
    return transcripts.filter(entry => entry.student_id === selectedStudent.id);
  }, [selectedStudent, transcripts]);

  // Check if student has passed or is taking a course
  const isCourseTakenOrInProgress = (courseCode: string): { taken: boolean; grade?: string; status?: string } => {
    const courseEntry = studentTranscripts.find(entry => entry.course_code === courseCode);
    if (!courseEntry) return { taken: false };
    
    const passingGrades = ['A', 'B', 'C'];
    const isPassed = passingGrades.includes(courseEntry.grade);
    const isInProgress = courseEntry.grade === 'IP';
    
    return {
      taken: isPassed || isInProgress,
      grade: courseEntry.grade,
      status: isInProgress ? 'In Progress' : isPassed ? 'Passed' : 'Failed'
    };
  };

  // Check if a class time slot is available based on user selection
  const isClassTimeAvailable = (classEntry: ClassEntry): boolean => {
    // If no availability is set, show all classes
    if (Object.keys(availability).length === 0) {
      return true;
    }

    // Check lecture time availability
    const lectureDays = [classEntry["Lecture Day 1"], classEntry["Lecture Day 2"]].filter(Boolean);
    const lectureTime = classEntry["Lecture Time"];
    
    if (lectureTime) {
      const [startTime, endTime] = lectureTime.split(' - ');
      const lectureAvailable = lectureDays.every(day => {
        // Find matching time slot in availability
        const timeSlotKey = Object.keys(availability).find(key => {
          const [keyStart, keyEnd] = key.split('-').slice(-2); // Get last two parts (start-end)
          return keyStart === startTime && keyEnd === endTime;
        });
        
        return timeSlotKey && availability[timeSlotKey]?.[day as keyof TimeAvailability];
      });
      
      if (!lectureAvailable) return false;
    }

    // Check discussion section time availability
    if (classEntry["DS Day"] && classEntry["DS Time"]) {
      const dsDay = classEntry["DS Day"];
      const dsTime = classEntry["DS Time"];
      const [dsStartTime, dsEndTime] = dsTime.split(' - ');
      
      const dsTimeSlotKey = Object.keys(availability).find(key => {
        const [keyStart, keyEnd] = key.split('-').slice(-2);
        return keyStart === dsStartTime && keyEnd === dsEndTime;
      });
      
      if (!dsTimeSlotKey || !availability[dsTimeSlotKey]?.[dsDay]) {
        return false;
      }
    }

    return true;
  };

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
    const allClasses = [...selectedClasses, ...scheduledClasses];
    return allClasses.some(selected => {
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
    const allClasses = [...selectedClasses, ...scheduledClasses];
    return allClasses.some(selected => selected.class["Course Code"] === classEntry["Course Code"]);
  };

  // Get student's scheduled classes from summer_schedules.json
  const studentScheduledClasses = useMemo(() => {
    if (!selectedStudent) return [];
    
    const studentScheduleEntries = summerSchedules.filter(
      entry => entry.student_id === selectedStudent.id
    );
    
    return studentScheduleEntries.map(entry => {
      const classEntry = classList.find(
        classItem => classItem["Section Code"] === entry.section_code
      );
      
      if (classEntry) {
        return {
          id: `${classEntry["Course Code"]}-${classEntry["Section Code"]}`,
          class: classEntry
        };
      }
      return null;
    }).filter(Boolean) as SelectedClass[];
  }, [selectedStudent, summerSchedules, classList]);

  const { availableClasses, conflictingClasses, takenClasses, transcriptOnlyClasses } = useMemo(() => {
    if (!selectedStudent) {
      return { availableClasses: [], conflictingClasses: [], takenClasses: [], transcriptOnlyClasses: [] };
    }

    const available: ClassEntry[] = [];
    const conflicting: ClassEntry[] = [];
    
    // Create a map of unique taken courses with their details
    const takenCoursesMap = new Map<string, { class: ClassEntry; grade: string; status: string }>();
    
    // Create a set of course codes that exist in the class list
    const availableCourseCodes = new Set(classList.map(c => c["Course Code"]));
    
    // Identify courses from transcripts that are not in the class list
    const transcriptOnlyCoursesMap = new Map<string, { courseCode: string; courseName: string; grade: string; status: string }>();
    
    // Process student transcripts to identify taken courses
    studentTranscripts.forEach(transcriptEntry => {
      const courseCode = transcriptEntry.course_code;
      const courseStatus = isCourseTakenOrInProgress(courseCode);
      
      if (courseStatus.taken) {
        if (availableCourseCodes.has(courseCode)) {
          // Course is available in class list - add to taken courses if not already processed
          if (!takenCoursesMap.has(courseCode)) {
            const representativeClass = classList.find(classEntry => 
              classEntry["Course Code"] === courseCode
            );
            
            if (representativeClass) {
              takenCoursesMap.set(courseCode, {
                class: representativeClass,
                grade: courseStatus.grade || '',
                status: courseStatus.status || ''
              });
            }
          }
        } else {
          // Course is not in class list - add to transcript-only courses
          if (!transcriptOnlyCoursesMap.has(courseCode)) {
            transcriptOnlyCoursesMap.set(courseCode, {
              courseCode: courseCode,
              courseName: transcriptEntry.course_name,
              grade: courseStatus.grade || '',
              status: courseStatus.status || ''
            });
          }
        }
      }
    });

    // Process all classes in the class list
    classList.forEach(classEntry => {
      const courseCode = classEntry["Course Code"];
      const courseStatus = isCourseTakenOrInProgress(courseCode);
      
      // Skip if course is already taken
      if (courseStatus.taken) {
        return;
      }
      
      // Skip if class is not available based on time availability
      if (!isClassTimeAvailable(classEntry)) {
        return;
      }
      
      // Check for conflicts with selected classes
      if (hasConflict(classEntry)) {
        conflicting.push(classEntry);
        return;
      }
      
      // Check if same course code is already selected
      if (hasSameCourseCode(classEntry)) {
        conflicting.push(classEntry);
        return;
      }
      
      // Class is available
      available.push(classEntry);
    });

    return {
      availableClasses: available,
      conflictingClasses: conflicting,
      takenClasses: Array.from(takenCoursesMap.values()),
      transcriptOnlyClasses: Array.from(transcriptOnlyCoursesMap.values())
    };
  }, [selectedStudent, classList, studentTranscripts, selectedClasses, availability]);

  const handleSelectClass = (classEntry: ClassEntry) => {
    const newSelectedClass: SelectedClass = {
      id: `${classEntry["Course Code"]}-${classEntry["Section Code"]}`,
      class: classEntry
    };
    setSelectedClasses(prev => [...prev, newSelectedClass]);
  };

  const handleUnselectClass = (classId: string) => {
    setSelectedClasses(prev => prev.filter(selected => selected.id !== classId));
  };

  const handleStudentChange = (student: Student | null) => {
    setSelectedStudent(student);
    setSelectedClasses([]); // Clear manually selected classes
    setScheduledClasses([]); // Clear scheduled classes
    setAvailability({}); // Clear availability when changing students
    
    // Load scheduled classes for the selected student
    if (student) {
      const studentScheduleEntries = summerSchedules.filter(
        entry => entry.student_id === student.id
      );
      
      const scheduled = studentScheduleEntries.map(entry => {
        const classEntry = classList.find(
          classItem => classItem["Section Code"] === entry.section_code
        );
        
        if (classEntry) {
          return {
            id: `${classEntry["Course Code"]}-${classEntry["Section Code"]}`,
            class: classEntry
          };
        }
        return null;
      }).filter(Boolean) as SelectedClass[];
      
      setScheduledClasses(scheduled);
    }
  };

  const handleCaptureSchedule = async () => {
    if (!scheduleRef.current) return;

    try {
      // Show loading state
      const button = document.querySelector('[data-screenshot-button]');
      if (button) {
        button.setAttribute('disabled', 'true');
        button.textContent = 'Capturing...';
      }

      // Capture the schedule
      const canvas = await html2canvas(scheduleRef.current, {
        scale: 1, // Higher quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedStudent?.name.replace(/\s+/g, '_')}_Schedule_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Reset button state
      if (button) {
        button.removeAttribute('disabled');
        button.textContent = 'Download Schedule';
      }
    } catch (error) {
      console.error('Failed to capture schedule:', error);
      // Reset button state
      const button = document.querySelector('[data-screenshot-button]');
      if (button) {
        button.removeAttribute('disabled');
        button.textContent = 'Download Schedule';
      }
    }
  };

  const handleRemoveScheduledClass = (classId: string) => {
    setScheduledClasses(prev => prev.filter(scheduled => scheduled.id !== classId));
  };

  const handleRemoveAllScheduledClasses = () => {
    setScheduledClasses([]);
  };

  const handleReset = () => {
    // Clear manually selected classes
    setSelectedClasses([]);
    
    // Reload the original scheduled classes from summer_schedules.json
    if (selectedStudent) {
      const studentScheduleEntries = summerSchedules.filter(
        entry => entry.student_id === selectedStudent.id
      );
      
      const scheduled = studentScheduleEntries.map(entry => {
        const classEntry = classList.find(
          classItem => classItem["Section Code"] === entry.section_code
        );
        
        if (classEntry) {
          return {
            id: `${classEntry["Course Code"]}-${classEntry["Section Code"]}`,
            class: classEntry
          };
        }
        return null;
      }).filter(Boolean) as SelectedClass[];
      
      setScheduledClasses(scheduled);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Student Schedule Builder</h1>
          </div>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to terms
          </Link>
        </div>

        {/* Always show the student selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <StudentSelector
            students={students}
            selectedStudent={selectedStudent}
            onStudentChange={handleStudentChange}
            timezone={timezone}
            onTimezoneChange={setTimezone}
          />
        </div>

        {selectedStudent ? (
          <div className="space-y-6">
            {/* Schedule Grid - Full Width */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-2 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Weekly Schedule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReset}
                      disabled={selectedClasses.length === 0 && scheduledClasses.length === 0}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                        selectedClasses.length === 0 && scheduledClasses.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsChangeRequestOpen(true)}
                      disabled={selectedClasses.length === 0 && scheduledClasses.length === 0}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        selectedClasses.length === 0 && scheduledClasses.length === 0
                          ? 'bg-blue-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Request Change
                    </button>
                    <ScheduleScreenshot 
                      onCapture={handleCaptureSchedule} 
                      disabled={selectedClasses.length === 0 && scheduledClasses.length === 0}
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[400px]" ref={scheduleRef}>
                <StudentScheduleGrid 
                  selectedClasses={[...scheduledClasses, ...selectedClasses]}
                  timezone={timezone}
                  onTimezoneChange={() => {}}
                  studentName={selectedStudent.name}
                />
              </div>
              
              {/* Scheduled Classes Summary */}
              {scheduledClasses.length > 0 && (
                <div className="border-t border-gray-200 p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-900">Scheduled Classes (Next Term)</h3>
                    <button
                      onClick={handleRemoveAllScheduledClasses}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Remove All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scheduledClasses.map(scheduled => (
                      <div
                        key={scheduled.id}
                        className="flex items-center gap-2 border rounded-md px-3 py-1.5 shadow-sm bg-blue-100 border-blue-300"
                      >
                        <span className="text-sm font-medium text-blue-900">
                          {scheduled.class["Course Name"].trim()} - Section {scheduled.class["Section Code"]}
                        </span>
                        <button
                          onClick={() => handleRemoveScheduledClass(scheduled.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manually Selected Classes Summary */}
              {selectedClasses.length > 0 && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Manually Selected Classes</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedClasses.map(selected => (
                      <div
                        key={selected.id}
                        className="flex items-center gap-2 border rounded-md px-3 py-1.5 shadow-sm bg-white border-purple-200"
                      >
                        <span className="text-sm font-medium text-purple-900">
                          {selected.class["Course Name"].trim()} - Section {selected.class["Section Code"]}
                        </span>
                        <button
                          onClick={() => handleUnselectClass(selected.id)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Middle Section - Time Availability and Class List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Time Availability */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-2 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Time Availability</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[400px]">
                  <SchedulerGrid 
                    availability={availability} 
                    timezone={timezone}
                    onAvailabilityChange={setAvailability}
                    showTimezoneSelector={false}
                  />
                </div>
              </div>

              {/* Right Column - Available Classes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-2 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Available Classes</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[400px]">
                  <StudentClassList
                    availableClasses={availableClasses}
                    conflictingClasses={conflictingClasses}
                    timezone={timezone}
                    onSelectClass={handleSelectClass}
                    showOnlyFilters={false}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Section - Transcript */}
            <StudentTranscript transcriptEntries={studentTranscripts} />

            {/* Schedule Change Request Popup */}
            <ScheduleChangeRequest
              student={selectedStudent}
              selectedClasses={[...scheduledClasses, ...selectedClasses]}
              isOpen={isChangeRequestOpen}
              onClose={() => setIsChangeRequestOpen(false)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Select a Student</h2>
            <p className="text-gray-600">Choose a student from the dropdown above to view their available courses and build their schedule.</p>
          </div>
        )}
      </div>
    </div>
  );
}