import React from 'react';

interface DayHeaderProps {
  day: string;
}

export function DayHeader({ day }: DayHeaderProps) {
  return (
    <th className="px-2 py-3 text-center font-semibold text-gray-900 bg-gray-100 w-20">
      {day}
    </th>
  );
}