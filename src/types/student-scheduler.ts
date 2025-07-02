export interface ClassEntry {
  "Section Code": string;
  "Course Code": string;
  "Course Name": string;
  "Time Slot": string;
  "Lecture Day 1": string;
  "Lecture Day 2": string | null;
  "Lecture Time": string;
  "DS Day": string | null;
  "DS Time": string | null;
}

export interface SelectedClass {
  id: string;
  class: ClassEntry;
}

export interface TranscriptEntry {
  student_id: string;
  student_name: string;
  email: string;
  course_code: string;
  course_name: string;
  grade: string;
  term: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  coachName?: string;
  termStatus?: string;
  termNumber?: string;
}

export type Timezone = 'Eastern' | 'Central' | 'Mountain' | 'Pacific';

// Re-export TimeAvailability from scheduler types for compatibility
export type { TimeAvailability, DayAvailability } from './scheduler';