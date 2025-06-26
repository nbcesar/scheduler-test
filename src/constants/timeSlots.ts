import { TimeSlotGroup } from '../types/scheduler';
import scheduleData from './q1_schedule_no_prefix_military_time.json';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];

// Convert time to sortable minutes, handling midnight crossing
const getSortableMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  // Add 24 hours (1440 minutes) to times between 00:00 and 01:59
  // This ensures they sort after the evening times (21:00-23:59)
  if (hours >= 0 && hours < 2) {
    return (hours + 24) * 60 + minutes;
  }
  return hours * 60 + minutes;
};

// Get unique time slots from the schedule data
const uniqueTimeSlots = Array.from(new Set(scheduleData.map(entry => `${entry["Start Time"]}-${entry["End Time"]}`)))
  .map(timeStr => {
    const [start, end] = timeStr.split('-');
    return { start, end };
  });

// Group time slots by period
const groupTimeSlots = () => {
  const morning = uniqueTimeSlots.filter(slot => {
    const hour = parseInt(slot.start.split(':')[0]);
    return hour >= 9 && hour < 13;
  }).sort((a, b) => getSortableMinutes(a.start) - getSortableMinutes(b.start));

  const evening = uniqueTimeSlots.filter(slot => {
    const hour = parseInt(slot.start.split(':')[0]);
    return hour >= 18 && hour < 22;
  }).sort((a, b) => getSortableMinutes(a.start) - getSortableMinutes(b.start));

  const late = uniqueTimeSlots.filter(slot => {
    const hour = parseInt(slot.start.split(':')[0]);
    return hour >= 21 || hour < 2; // Include slots from 21:00 to 01:59
  }).sort((a, b) => getSortableMinutes(a.start) - getSortableMinutes(b.start));

  return [
    {
      name: 'Morning Classes (AM EST)',
      slots: morning.map(slot => ({
        ...slot,
        id: `morning-${slot.start}-${slot.end}`
      }))
    },
    {
      name: 'Afternoon Classes (PM EST)',
      slots: evening.map(slot => ({
        ...slot,
        id: `evening-${slot.start}-${slot.end}`
      }))
    },
    {
      name: 'Night Classes (PM PST)',
      slots: late.map(slot => ({
        ...slot,
        id: `late-${slot.start}-${slot.end}`
      }))
    }
  ].filter(group => group.slots.length > 0);
};

export const TIME_SLOTS: TimeSlotGroup[] = groupTimeSlots();