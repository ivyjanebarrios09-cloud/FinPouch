
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCustomTimestamp(timestamp: string): Date | null {
  // Expected format: "MM/DD/YYYY - hh:mm:ss AM/PM"
  const parts = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4}) - (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)/);
  if (!parts) return null;

  const [, month, day, year, hour, minute, second, ampm] = parts;
  
  let hour24 = parseInt(hour, 10);
  if (ampm === 'PM' && hour24 < 12) {
    hour24 += 12;
  }
  if (ampm === 'AM' && hour24 === 12) {
    hour24 = 0;
  }

  // month is 0-indexed in JavaScript Date
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
  
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
    
