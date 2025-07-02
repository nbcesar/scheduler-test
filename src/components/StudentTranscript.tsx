import React from 'react';
import { TranscriptEntry } from '../types/student-scheduler';
import { CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';

interface StudentTranscriptProps {
  transcriptEntries: TranscriptEntry[];
}

export function StudentTranscript({ transcriptEntries }: StudentTranscriptProps) {
  // Get credits from the first entry (they should be the same for all entries of the same student)
  const creditsInfo = transcriptEntries.length > 0 ? {
    completed: transcriptEntries[0].cumulative_credits_completed || 0,
    attempted: transcriptEntries[0].cumulative_credits_attempted || 0
  } : { completed: 0, attempted: 0 };

  const getGradeIcon = (grade: string, status: string) => {
    if (status === 'In Progress') {
      return <Clock className="w-4 h-4 text-blue-500" />;
    }
    if (status === 'Passed') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getGradeColor = (grade: string, status: string) => {
    if (status === 'In Progress') {
      return 'text-blue-600 bg-blue-100';
    }
    if (status === 'Passed') {
      return 'text-green-600 bg-green-100';
    }
    return 'text-red-600 bg-red-100';
  };

  // Group transcript entries by term
  const groupedByTerm = transcriptEntries.reduce((acc, entry) => {
    const term = entry.term || 'Other';
    if (!acc[term]) {
      acc[term] = [];
    }
    acc[term].push(entry);
    return acc;
  }, {} as Record<string, TranscriptEntry[]>);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-2 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Academic Transcript</span>
          </div>
        </div>
      </div>
      
      {/* Credits Summary */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Credits Completed</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {creditsInfo.completed}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Credits Attempted</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {creditsInfo.attempted}
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="p-4">
        {Object.entries(groupedByTerm).map(([term, entries]) => (
          <div key={term} className="mb-6 last:mb-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{term}</h3>
            <div className="space-y-2">
              {entries.map((entry) => {
                const status = entry.grade === 'IP' ? 'In Progress' : 
                             ['A', 'B', 'C', 'CR'].includes(entry.grade) ? 'Passed' : 'Failed';
                
                return (
                  <div
                    key={`${entry.course_code}-${entry.term}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      {getGradeIcon(entry.grade, status)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.course_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.course_code}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${getGradeColor(entry.grade, status)}`}>
                        {entry.grade} ({status})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 