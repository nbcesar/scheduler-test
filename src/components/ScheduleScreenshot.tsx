import React from 'react';
import { Camera } from 'lucide-react';

interface ScheduleScreenshotProps {
  onCapture: () => void;
  disabled?: boolean;
}

export function ScheduleScreenshot({ onCapture, disabled }: ScheduleScreenshotProps) {
  return (
    <button
      onClick={onCapture}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
        disabled 
          ? 'bg-purple-300 cursor-not-allowed' 
          : 'bg-purple-600 hover:bg-purple-700'
      }`}
    >
      <Camera className="w-4 h-4" />
      Download Schedule
    </button>
  );
} 