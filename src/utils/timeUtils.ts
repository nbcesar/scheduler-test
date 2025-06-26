import { Timezone } from '../types/scheduler';

export function convertTime(time: string, timezone: Timezone): string {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Convert from Eastern to target timezone
  const timezoneOffsets = {
    Eastern: 0,
    Central: 1,
    Mountain: 2,
    Pacific: 3
  };
  
  let adjustedHours = hours - timezoneOffsets[timezone];
  
  // Handle day wraparound
  if (adjustedHours < 0) {
    adjustedHours += 24;
  }
  
  // Convert to 12-hour format
  let period = adjustedHours >= 12 ? 'PM' : 'AM';
  if (adjustedHours > 12) {
    adjustedHours -= 12;
  } else if (adjustedHours === 0) {
    adjustedHours = 12;
  }
  
  return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTimeRange(start: string, end: string, timezone: Timezone): string {
  const startTime = convertTime(start, timezone);
  const endTime = convertTime(end, timezone);
  return `${startTime} - ${endTime}`;
}

// Normalize time slots to standard format across the app
export function normalizeTimeSlot(timeSlot: string): string {
  const slot = timeSlot.toLowerCase();
  
  // Morning = AM EST (9am - 1pm est). 4 slots.
  if (slot.includes('morning') || (slot.includes('am') && slot.includes('et'))) {
    return 'morning';
  }
  
  // Afternoon = PM EST (6pm - 10pm est). 4 slots.
  if (slot.includes('afternoon') || 
      (slot.includes('pm') && slot.includes('et') && !slot.includes('night'))) {
    return 'afternoon';
  }
  
  // Night = PM PST (9pm - 1am est). 4 slots.
  if (slot.includes('night') || slot.includes('evening') || 
      (slot.includes('pm') && slot.includes('pst'))) {
    return 'night';
  }
  
  return timeSlot; // fallback to original
}

// Get ordered time slots for consistent display
export function getOrderedTimeSlots(): string[] {
  return ['morning', 'afternoon', 'night'];
}

// Sort time slots in the correct order
export function sortTimeSlots(timeSlots: string[]): string[] {
  const order = getOrderedTimeSlots();
  
  return timeSlots.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    
    // If both are in the order array, sort by their position
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one is in the order array, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });
}