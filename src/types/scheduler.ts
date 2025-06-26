export interface TimeSlot {
  start: string;
  end: string;
  id: string;
}

export interface TimeSlotGroup {
  name: string;
  slots: TimeSlot[];
}

export type DayAvailability = {
  [key: string]: boolean;
}

export type TimeAvailability = {
  [key: string]: DayAvailability;
}

export interface ScheduleEntry {
  Combo: string;
  Day: string;
  "Start Time": string;
  "End Time": string;
  Type: string;
  "Course Name": string;
  Foundations?: string;
}

export type Timezone = 'Eastern' | 'Central' | 'Mountain' | 'Pacific';