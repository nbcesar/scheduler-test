import React from 'react';
import { X, Copy } from 'lucide-react';

interface ScheduleChangeRequestProps {
  student: {
    id: string;
    name: string;
    email: string;
  };
  selectedClasses: Array<{
    class: {
      "Section Code": string;
    };
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleChangeRequest({ student, selectedClasses, isOpen, onClose }: ScheduleChangeRequestProps) {
  if (!isOpen) return null;

  // Format the data for Google Sheets
  const formattedData = selectedClasses.map(selected => 
    `${student.id},${student.name},${student.email},${selected.class["Section Code"]}`
  ).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Schedule Change Request</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Copy the following data to paste into the Google Sheet:
            </p>
            <div className="relative">
              <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm font-mono overflow-x-auto">
                {formattedData}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 bg-white rounded-md shadow-sm border border-gray-200"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Format:</p>
            <p>student id, student name, email, section code</p>
          </div>
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 