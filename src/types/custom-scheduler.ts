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

export type Timezone = 'Eastern' | 'Central' | 'Mountain' | 'Pacific';