import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Search, X } from 'lucide-react';
import { Student, Timezone } from '../types/student-scheduler';

interface StudentSelectorProps {
  students: Student[];
  selectedStudent: Student | null;
  onStudentChange: (student: Student | null) => void;
  timezone: Timezone;
  onTimezoneChange: (timezone: Timezone) => void;
}

export function StudentSelector({ students, selectedStudent, onStudentChange, timezone, onTimezoneChange }: StudentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter students based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleStudentSelect = (student: Student) => {
    onStudentChange(student);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onStudentChange(null);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (event.key === 'Enter' && filteredStudents.length === 1) {
      handleStudentSelect(filteredStudents[0]);
    } else if (event.key === 'ArrowDown' && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 flex-1">
          <User className="w-5 h-5 text-purple-600" />
          <label className="text-sm font-medium text-gray-700">
            Select Student:
          </label>
          <div className="relative flex-1 max-w-md" ref={dropdownRef}>
            <div className="relative">
              <div
                className={`w-full border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm bg-white cursor-text focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 ${
                  selectedStudent ? 'text-gray-900' : 'text-gray-500'
                }`}
                onClick={handleInputClick}
              >
                {selectedStudent ? (
                  <div className="flex items-center justify-between">
                    <span>{selectedStudent.name} ({selectedStudent.email})</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSelection();
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full outline-none bg-transparent"
                  />
                )}
              </div>
              
              {!selectedStudent && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <Search className="w-4 h-4 text-gray-400" />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              )}
            </div>

            {isOpen && !selectedStudent && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  <div className="py-1">
                    {filteredStudents.map(student => (
                      <button
                        key={student.id}
                        onClick={() => handleStudentSelect(student)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 focus:bg-purple-50 focus:outline-none"
                      >
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.email}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No students found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Timezone Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="timezone" className="text-sm font-medium text-gray-700">
            Timezone:
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value as Timezone)}
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="Eastern">Eastern Time</option>
            <option value="Central">Central Time</option>
            <option value="Mountain">Mountain Time</option>
            <option value="Pacific">Pacific Time</option>
          </select>
        </div>
      </div>
    </div>
  );
}