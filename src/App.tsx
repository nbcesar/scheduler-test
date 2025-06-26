import React from 'react';
import { Clock } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Q1Schedule } from './pages/Q1Schedule';
import { CustomSchedule } from './pages/CustomSchedule';
import { StudentSchedule } from './pages/StudentSchedule';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/q1" element={<Q1Schedule />} />
        <Route path="/custom" element={<CustomSchedule />} />
        <Route path="/student" element={<StudentSchedule />} />
      </Routes>
    </div>
  );
}

export default App;