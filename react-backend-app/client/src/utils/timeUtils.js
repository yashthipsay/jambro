/**
 * Utility functions for time formatting and categorization
 */

/**
 * Converts time from 24-hour format to 12-hour format
 * @param {string} time - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format with AM/PM
 */
export const convertTo12HourFormat = (time) => {
  if (!time) return "";
  
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  
  if (hour === 0) {
    return `12:${minutes} AM`;
  } else if (hour === 12) {
    return `12:${minutes} PM`;
  } else if (hour > 12) {
    return `${hour - 12}:${minutes} PM`;
  } else {
    return `${hour}:${minutes} AM`;
  }
};

/**
 * Categorizes a time slot based on its start time
 * @param {string} startTime - Start time in 24-hour format (HH:MM)
 * @returns {string} Category: 'morning', 'afternoon', or 'evening'
 */
export const categorizeTimeSlot = (startTime) => {
  if (!startTime) return "unknown";

  const hour = parseInt(startTime.split(":")[0], 10);
  
  if (hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 17) {
    return "afternoon";
  } else {
    return "evening";
  }
};

/**
 * Groups time slots by their category
 * @param {Array} slots - Array of slot objects
 * @returns {Object} Object with morning, afternoon, and evening slot arrays
 */
export const groupSlotsByCategory = (slots) => {
  if (!slots || !Array.isArray(slots)) return { morning: [], afternoon: [], evening: [] };
  
  return slots.reduce(
    (groups, slot) => {
      const category = categorizeTimeSlot(slot.startTime);
      groups[category].push(slot);
      return groups;
    },
    { morning: [], afternoon: [], evening: [] }
  );
};