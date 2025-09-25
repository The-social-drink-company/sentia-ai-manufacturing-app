import React from 'react';
import { Routes, Route } from 'react-router-dom';
import WorkingCapital from '../../components/WorkingCapital/WorkingCapital';
import EnhancedWorkingCapital from '../../components/WorkingCapital/EnhancedWorkingCapital';
import EnhancedWorkingCapitalAnalysis from '../../components/analytics/EnhancedWorkingCapitalAnalysis';

const Financial = () => {
  return (
    <div className="financial-container">
      <Routes>
        <Route index element={<EnhancedWorkingCapital />} />
        <Route path="working-capital" element={<WorkingCapital />} />
        <Route path="analysis" element={<EnhancedWorkingCapitalAnalysis />} />
      </Routes>
    </div>
  );
};

export default Financial;