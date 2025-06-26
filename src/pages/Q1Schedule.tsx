import React from 'react';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SchedulerGrid } from '../components/SchedulerGrid';
import { ScheduleList } from '../components/ScheduleList';
import { TimeAvailability, Timezone } from '../types/scheduler';

export function Q1Schedule() {
  const [availability, setAvailability] = React.useState<TimeAvailability>({});
  const [timezone, setTimezone] = React.useState<Timezone>('Eastern');

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Q1 Schedule Availability</h1>
          </div>
          <Link
            to="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to terms
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <SchedulerGrid 
              availability={availability} 
              timezone={timezone}
              onTimezoneChange={setTimezone}
              onAvailabilityChange={setAvailability} 
            />
          </div>
          <div>
            <ScheduleList 
              availability={availability}
              timezone={timezone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}