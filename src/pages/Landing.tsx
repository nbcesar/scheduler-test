import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Settings, User } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Campus Scheduler
          </h1>
          <p className="text-gray-600">
            Select a term to start planning your class schedule
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/q1"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 transition-colors"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Q1 Schedules</h2>
              <p className="text-sm text-gray-600">Plan your Q1 class schedule</p>
            </div>
            <div className="text-blue-600">→</div>
          </Link>
          
          <Link
            to="/custom"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-green-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Custom Schedules</h2>
                <p className="text-sm text-gray-600">Create your own custom schedule</p>
              </div>
            </div>
            <div className="text-green-600">→</div>
          </Link>

          <Link
            to="/student"
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-purple-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Student Schedules</h2>
                <p className="text-sm text-gray-600">View and manage student schedules</p>
              </div>
            </div>
            <div className="text-purple-600">→</div>
          </Link>
        </div>
      </div>
    </div>
  );
}