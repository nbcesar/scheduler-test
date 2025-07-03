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
import summerSchedulesData from '../constants/summer_schedules.json';
import studentsData from '../constants/students.json';
import { StudentTranscript } from '../components/StudentTranscript';
import html2canvas from 'html2canvas';
import { ScheduleScreenshot } from '../components/ScheduleScreenshot';
import { ScheduleChangeRequest } from '../components/ScheduleChangeRequest';

// Add type for summer schedule entries
interface SummerScheduleEntry {
  student_id: string;
  section_code: string;
}

// Add type for student entries from students.json
interface StudentEntry {
  person_id: string;
  user_id: string;
  student_name: string;
  email: string;
  coach_name: string;
  term_status_classification: string;
  term_number: string;
  rn: string;
}

// Add type for schedule conflicts
interface ScheduleConflict {
  class1: ClassEntry;
  class2: ClassEntry;
  conflictType: 'lecture' | 'discussion' | 'lecture-discussion';
  day: string;
  time: string;
}

export function StudentSchedule() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<SelectedClass[]>([]);
  const [timezone, setTimezone] = useState<Timezone>('Eastern');
  const [availability, setAvailability] = useState<TimeAvailability>({});
  const [classSearchTerm, setClassSearchTerm] = useState<string>('');
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([]);
  const [isScheduleValid, setIsScheduleValid] = useState<boolean>(true);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);

  const classList = classListData as ClassEntry[];
  const transcripts = transcriptsData as TranscriptEntry[];
  const summerSchedules = summerSchedulesData as SummerScheduleEntry[];
  const students = studentsData as StudentEntry[];

  // Get students from students.json and convert to Student type
  const studentList = useMemo(() => {
    return students
      .filter(student => 
        student.student_name && 
        typeof student.student_name === 'string' && 
        student.student_name.trim() !== '' &&
        student.email &&
        typeof student.email === 'string' &&
        student.email.trim() !== '' &&
        student.user_id &&
        typeof student.user_id === 'string' &&
        student.user_id.trim() !== ''
      )
      .map(student => ({
        id: student.user_id.trim(),
        name: student.student_name.trim(),
        email: student.email.trim(),
        coachName: student.coach_name,
        termStatus: student.term_status_classification,
        termNumber: student.term_number
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  // Get student's summer schedule entries using user_id
  const studentSummerSchedule = useMemo(() => {
    if (!selectedStudent) return [];
    return summerSchedules.filter(entry => entry.student_id === selectedStudent.id);
  }, [selectedStudent, summerSchedules]);

  // Get student's transcript entries using user_id
  const studentTranscripts = useMemo(() => {
    if (!selectedStudent) return [];
    return transcripts.filter(entry => entry.student_id === selectedStudent.id);
  }, [selectedStudent, transcripts]);

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

  // Function to detect conflicts within scheduled classes
  const detectScheduledConflicts = (classes: SelectedClass[]): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = [];

    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        const class1 = classes[i].class;
        const class2 = classes[j].class;

        // Check lecture conflicts
        const lectureDays1 = [class1["Lecture Day 1"], class1["Lecture Day 2"]].filter(Boolean);
        const lectureDays2 = [class2["Lecture Day 1"], class2["Lecture Day 2"]].filter(Boolean);
        
        const lectureConflict = lectureDays1.some(day1 => 
          lectureDays2.some(day2 => 
            day1 === day2 && timeRangesConflict(class1["Lecture Time"], class2["Lecture Time"])
          )
        );

        if (lectureConflict) {
          const conflictingDay = lectureDays1.find(day1 => 
            lectureDays2.some(day2 => 
              day1 === day2 && timeRangesConflict(class1["Lecture Time"], class2["Lecture Time"])
            )
          );
          conflicts.push({
            class1,
            class2,
            conflictType: 'lecture',
            day: conflictingDay || '',
            time: class1["Lecture Time"]
          });
        }

        // Check discussion section conflicts
        const dsConflict = class1["DS Day"] && class2["DS Day"] &&
          class1["DS Day"] === class2["DS Day"] &&
          timeRangesConflict(class1["DS Time"] || '', class2["DS Time"] || '');

        if (dsConflict) {
          conflicts.push({
            class1,
            class2,
            conflictType: 'discussion',
            day: class1["DS Day"] || '',
            time: class1["DS Time"] || ''
          });
        }

        // Check lecture vs DS conflicts
        const lectureDsConflict = lectureDays1.some(lectureDay =>
          class2["DS Day"] === lectureDay &&
          timeRangesConflict(class1["Lecture Time"], class2["DS Time"] || '')
        ) || (class1["DS Day"] && lectureDays2.some(lectureDay =>
          class1["DS Day"] === lectureDay &&
          timeRangesConflict(class1["DS Time"] || '', class2["Lecture Time"])
        ));

        if (lectureDsConflict) {
          conflicts.push({
            class1,
            class2,
            conflictType: 'lecture-discussion',
            day: class1["DS Day"] || class2["DS Day"] || '',
            time: class1["DS Time"] || class2["Lecture Time"] || ''
          });
        }
      }
    }

    return conflicts;
  };

  // Check if student has passed or is taking a course
  const isCourseTakenOrInProgress = (courseCode: string): { taken: boolean; grade?: string; status?: string } => {
    const courseEntry = studentTranscripts.find(entry => entry.course_code === courseCode);
    if (!courseEntry) return { taken: false };
    
    const passingGrades = ['A', 'B', 'C', 'CR'];
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

  const { availableClasses, conflictingClasses, takenClasses, transcriptOnlyClasses, hasPassedPrerequisite } = useMemo(() => {
    if (!selectedStudent) {
      return { availableClasses: [], conflictingClasses: [], takenClasses: [], transcriptOnlyClasses: [], hasPassedPrerequisite: () => false };
    }

    // Helper functions defined inside useMemo to avoid dependency issues
    const isCourseTakenOrInProgress = (courseCode: string): { taken: boolean; grade?: string; status?: string } => {
      const courseEntry = studentTranscripts.find(entry => entry.course_code === courseCode);
      if (!courseEntry) return { taken: false };
      
      const passingGrades = ['A', 'B', 'C', 'CR'];
      const isPassed = passingGrades.includes(courseEntry.grade);
      const isInProgress = courseEntry.grade === 'IP';
      
      return {
        taken: isPassed || isInProgress,
        grade: courseEntry.grade,
        status: isInProgress ? 'In Progress' : isPassed ? 'Passed' : 'Failed'
      };
    };

    // Check if student has passed a prerequisite course
    const hasPassedPrerequisite = (prerequisiteCode: string): boolean => {
      const prerequisiteEntry = studentTranscripts.find(entry => entry.course_code === prerequisiteCode);
      if (!prerequisiteEntry) return false;
      
      const passingGrades = ['A', 'B', 'C', 'CR'];
      return passingGrades.includes(prerequisiteEntry.grade);
    };

    // Check if student meets prerequisites for a class
    const meetsPrerequisites = (classEntry: ClassEntry): boolean => {
      const prerequisite = classEntry["Prereq"];
      if (!prerequisite || prerequisite.trim() === '') {
        return true; // No prerequisite required
      }
      
      return hasPassedPrerequisite(prerequisite);
    };

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
      
      // For passed courses, always show as taken
      if (courseStatus.taken && courseStatus.status !== 'In Progress') {
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

    // Get all currently selected classes (both scheduled and manually selected)
    const allSelectedClasses = [...selectedClasses, ...scheduledClasses];
    
    // Create sets for quick lookup
    const selectedCourseCodes = new Set(allSelectedClasses.map(c => c.class["Course Code"]));
    const selectedClassIds = new Set(allSelectedClasses.map(c => c.id));

    // Process IP classes - only show as taken if they're in the schedule grid
    studentTranscripts.forEach(transcriptEntry => {
      const courseCode = transcriptEntry.course_code;
      const courseStatus = isCourseTakenOrInProgress(courseCode);
      
      // For IP classes, only show as taken if they're in the schedule grid
      if (courseStatus.status === 'In Progress' && selectedCourseCodes.has(courseCode)) {
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
      const classId = `${classEntry["Course Code"]}-${classEntry["Section Code"]}`;
      const courseStatus = isCourseTakenOrInProgress(courseCode);
      
      // Skip if course is already passed (but allow IP classes unless they're in the schedule grid)
      if (courseStatus.taken && courseStatus.status !== 'In Progress') {
        return;
      }
      
      // For IP classes, only skip if they're currently in the schedule grid
      if (courseStatus.status === 'In Progress') {
        const isInScheduleGrid = selectedCourseCodes.has(courseCode);
        if (isInScheduleGrid) {
          return;
        }
      }
      
      // Skip if class is not available based on time availability
      if (!isClassTimeAvailable(classEntry)) {
        return;
      }
      
      // Skip if this exact class is already selected
      if (selectedClassIds.has(classId)) {
        return;
      }
      
      // Skip if student doesn't meet prerequisites
      if (!meetsPrerequisites(classEntry)) {
        conflicting.push(classEntry);
        return;
      }
      
      // Check for conflicts with selected classes
      if (hasConflict(classEntry)) {
        conflicting.push(classEntry);
        return;
      }
      
      // Check if same course code is already selected
      if (selectedCourseCodes.has(courseCode)) {
        conflicting.push(classEntry);
        return;
      }
      
      // Class is available
      available.push(classEntry);
    });

    // Filter available classes by search term
    const filteredAvailableClasses = available.filter(classEntry => {
      if (!classSearchTerm.trim()) return true;
      
      const searchLower = classSearchTerm.toLowerCase();
      const courseName = classEntry["Course Name"].toLowerCase();
      const courseCode = classEntry["Course Code"].toLowerCase();
      
      return courseName.includes(searchLower) || courseCode.includes(searchLower);
    });

    return {
      availableClasses: filteredAvailableClasses,
      conflictingClasses: conflicting,
      takenClasses: Array.from(takenCoursesMap.values()),
      transcriptOnlyClasses: Array.from(transcriptOnlyCoursesMap.values()),
      hasPassedPrerequisite
    };
  }, [selectedStudent, classList, studentTranscripts, selectedClasses, scheduledClasses, availability, classSearchTerm]);

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

  const handleRemoveScheduledClass = (classId: string) => {
    setScheduledClasses(prev => prev.filter(scheduled => scheduled.id !== classId));
  };

  const handleRemoveAllScheduledClasses = () => {
    setScheduledClasses([]);
  };

  const handleStudentChange = (student: Student | null) => {
    setSelectedStudent(student);
    setSelectedClasses([]); // Clear manually selected classes
    setScheduledClasses([]); // Clear scheduled classes
    setAvailability({}); // Clear availability when changing students
    setClassSearchTerm(''); // Clear search term when changing students
    setScheduleConflicts([]); // Clear previous conflicts
    setIsScheduleValid(true); // Reset schedule validity
    
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
      
      // Detect conflicts in the scheduled classes
      const conflicts = detectScheduledConflicts(scheduled);
      setScheduleConflicts(conflicts);
      setIsScheduleValid(conflicts.length === 0);
    }
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
      
      // Re-check for conflicts
      const conflicts = detectScheduledConflicts(scheduled);
      setScheduleConflicts(conflicts);
      setIsScheduleValid(conflicts.length === 0);
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
            students={studentList}
            selectedStudent={selectedStudent}
            onStudentChange={handleStudentChange}
            timezone={timezone}
            onTimezoneChange={setTimezone}
          />
        </div>

        {selectedStudent ? (
          <div className="space-y-6">
            {/* Schedule Conflict Warning */}
            {!isScheduleValid && scheduleConflicts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <h3 className="text-red-900 font-semibold">Schedule Conflicts Detected</h3>
                </div>
                <p className="text-red-700 text-sm mb-3">
                  The student's scheduled classes have {scheduleConflicts.length} conflict{scheduleConflicts.length !== 1 ? 's' : ''}. 
                  Please review and resolve these conflicts before proceeding.
                </p>
                <div className="space-y-2">
                  {scheduleConflicts.map((conflict, index) => (
                    <div key={index} className="bg-red-100 p-3 rounded border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          conflict.conflictType === 'lecture' ? 'bg-red-200 text-red-800' :
                          conflict.conflictType === 'discussion' ? 'bg-orange-200 text-orange-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {conflict.conflictType.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-red-900">
                          {conflict.day} at {conflict.time}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="bg-white p-2 rounded">
                          <span className="font-medium text-red-900">{conflict.class1["Course Name"]}</span>
                          <div className="text-xs text-red-700">Section {conflict.class1["Section Code"]}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <span className="font-medium text-red-900">{conflict.class2["Course Name"]}</span>
                          <div className="text-xs text-red-700">Section {conflict.class2["Section Code"]}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      // Option to remove all conflicting classes
                      const conflictingClassIds = new Set();
                      scheduleConflicts.forEach(conflict => {
                        conflictingClassIds.add(`${conflict.class1["Course Code"]}-${conflict.class1["Section Code"]}`);
                        conflictingClassIds.add(`${conflict.class2["Course Code"]}-${conflict.class2["Section Code"]}`);
                      });
                      setScheduledClasses(prev => prev.filter(c => !conflictingClassIds.has(c.id)));
                      setScheduleConflicts([]);
                      setIsScheduleValid(true);
                    }}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200"
                  >
                    Remove All Conflicting Classes
                  </button>
                </div>
              </div>
            )}

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
                      <span className="text-sm font-medium text-gray-700">
                        Available Classes
                        {classSearchTerm && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({availableClasses.length} found)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search classes..."
                          value={classSearchTerm}
                          onChange={(e) => setClassSearchTerm(e.target.value)}
                          className="w-48 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        {classSearchTerm && (
                          <button
                            onClick={() => setClassSearchTerm('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
                    hasPassedPrerequisite={hasPassedPrerequisite}
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