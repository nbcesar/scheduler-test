import { ClassEntry } from '../types/student-scheduler';

interface SummerScheduleEntry {
  student_id: string;
  section_code: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ScheduleConflict {
  student1: Student;
  student2: Student;
  conflictingClass1: ClassEntry;
  conflictingClass2: ClassEntry;
  conflictType: 'lecture' | 'discussion' | 'lecture-discussion';
  day: string;
  time: string;
}

export class ScheduleConflictDetector {
  private classList: ClassEntry[];
  private students: Student[];

  constructor(classList: ClassEntry[], students: Student[]) {
    this.classList = classList;
    this.students = students;
  }

  // Check if two time ranges conflict
  private timeRangesConflict(time1: string, time2: string): boolean {
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
  }

  // Check if two classes conflict
  private classesConflict(class1: ClassEntry, class2: ClassEntry): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Check lecture conflicts
    const lectureDays1 = [class1["Lecture Day 1"], class1["Lecture Day 2"]].filter(Boolean);
    const lectureDays2 = [class2["Lecture Day 1"], class2["Lecture Day 2"]].filter(Boolean);
    
    lectureDays1.forEach(day1 => {
      lectureDays2.forEach(day2 => {
        if (day1 === day2 && this.timeRangesConflict(class1["Lecture Time"], class2["Lecture Time"])) {
          conflicts.push({
            student1: {} as Student, // Will be filled later
            student2: {} as Student, // Will be filled later
            conflictingClass1: class1,
            conflictingClass2: class2,
            conflictType: 'lecture',
            day: day1,
            time: `${class1["Lecture Time"]} vs ${class2["Lecture Time"]}`
          });
        }
      });
    });

    // Check discussion section conflicts
    if (class1["DS Day"] && class2["DS Day"] && 
        class1["DS Day"] === class2["DS Day"] && 
        this.timeRangesConflict(class1["DS Time"] || '', class2["DS Time"] || '')) {
      conflicts.push({
        student1: {} as Student,
        student2: {} as Student,
        conflictingClass1: class1,
        conflictingClass2: class2,
        conflictType: 'discussion',
        day: class1["DS Day"],
        time: `${class1["DS Time"]} vs ${class2["DS Time"]}`
      });
    }

    // Check lecture vs discussion conflicts
    lectureDays1.forEach(lectureDay => {
      if (class2["DS Day"] === lectureDay && 
          this.timeRangesConflict(class1["Lecture Time"], class2["DS Time"] || '')) {
        conflicts.push({
          student1: {} as Student,
          student2: {} as Student,
          conflictingClass1: class1,
          conflictingClass2: class2,
          conflictType: 'lecture-discussion',
          day: lectureDay,
          time: `${class1["Lecture Time"]} vs ${class2["DS Time"]}`
        });
      }
    });

    lectureDays2.forEach(lectureDay => {
      if (class1["DS Day"] === lectureDay && 
          this.timeRangesConflict(class2["Lecture Time"], class1["DS Time"] || '')) {
        conflicts.push({
          student1: {} as Student,
          student2: {} as Student,
          conflictingClass1: class1,
          conflictingClass2: class2,
          conflictType: 'lecture-discussion',
          day: lectureDay,
          time: `${class2["Lecture Time"]} vs ${class1["DS Time"]}`
        });
      }
    });

    return conflicts;
  }

  // Detect all conflicts across all students
  public detectAllConflicts(summerSchedules: SummerScheduleEntry[]): ScheduleConflict[] {
    const allConflicts: ScheduleConflict[] = [];
    
    // Group students by their summer classes
    const studentSchedules = new Map<string, ClassEntry[]>();
    
    summerSchedules.forEach(entry => {
      const classEntry = this.classList.find(c => c["Section Code"] === entry.section_code);
      if (classEntry) {
        if (!studentSchedules.has(entry.student_id)) {
          studentSchedules.set(entry.student_id, []);
        }
        studentSchedules.get(entry.student_id)!.push(classEntry);
      }
    });

    // Compare each student's schedule with every other student's schedule
    const studentIds = Array.from(studentSchedules.keys());
    
    for (let i = 0; i < studentIds.length; i++) {
      for (let j = i + 1; j < studentIds.length; j++) {
        const student1Id = studentIds[i];
        const student2Id = studentIds[j];
        
        const student1Classes = studentSchedules.get(student1Id)!;
        const student2Classes = studentSchedules.get(student2Id)!;
        
        // Compare each class from student1 with each class from student2
        student1Classes.forEach(class1 => {
          student2Classes.forEach(class2 => {
            const conflicts = this.classesConflict(class1, class2);
            
            conflicts.forEach(conflict => {
              const student1 = this.students.find(s => s.id === student1Id);
              const student2 = this.students.find(s => s.id === student2Id);
              
              if (student1 && student2) {
                conflict.student1 = student1;
                conflict.student2 = student2;
                allConflicts.push(conflict);
              }
            });
          });
        });
      }
    }

    return allConflicts;
  }

  // Get conflicts for a specific student
  public detectStudentConflicts(studentId: string, summerSchedules: SummerScheduleEntry[]): ScheduleConflict[] {
    const allConflicts = this.detectAllConflicts(summerSchedules);
    return allConflicts.filter(conflict => 
      conflict.student1.id === studentId || conflict.student2.id === studentId
    );
  }

  // Get summary statistics
  public getConflictSummary(summerSchedules: SummerScheduleEntry[]): {
    totalConflicts: number;
    studentsWithConflicts: number;
    conflictTypes: { [key: string]: number };
    mostConflictedStudents: { student: Student; conflictCount: number }[];
  } {
    const allConflicts = this.detectAllConflicts(summerSchedules);
    const studentsWithConflicts = new Set<string>();
    const conflictTypes: { [key: string]: number } = {};
    const studentConflictCounts = new Map<string, number>();

    allConflicts.forEach(conflict => {
      studentsWithConflicts.add(conflict.student1.id);
      studentsWithConflicts.add(conflict.student2.id);
      
      conflictTypes[conflict.conflictType] = (conflictTypes[conflict.conflictType] || 0) + 1;
      
      studentConflictCounts.set(conflict.student1.id, 
        (studentConflictCounts.get(conflict.student1.id) || 0) + 1);
      studentConflictCounts.set(conflict.student2.id, 
        (studentConflictCounts.get(conflict.student2.id) || 0) + 1);
    });

    const mostConflictedStudents = Array.from(studentConflictCounts.entries())
      .map(([studentId, count]) => ({
        student: this.students.find(s => s.id === studentId)!,
        conflictCount: count
      }))
      .sort((a, b) => b.conflictCount - a.conflictCount)
      .slice(0, 10);

    return {
      totalConflicts: allConflicts.length,
      studentsWithConflicts: studentsWithConflicts.size,
      conflictTypes,
      mostConflictedStudents
    };
  }
}

// Add this function for easy external access
export function analyzeSummerScheduleConflicts(
  classList: ClassEntry[],
  students: Student[],
  summerSchedules: SummerScheduleEntry[]
) {
  const detector = new ScheduleConflictDetector(classList, students);
  return {
    allConflicts: detector.detectAllConflicts(summerSchedules),
    summary: detector.getConflictSummary(summerSchedules)
  };
} 