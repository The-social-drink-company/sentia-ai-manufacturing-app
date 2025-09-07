import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Test from './Test';

function AppSimple() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <h1>Simple App Test</h1>
        <Routes>
          <Route path="/test" element={<Test />} />
          <Route path="/" element={<div><h2>Home</h2><p>App is working!</p></div>} />
          <Route path="/simple" element={<div>Simple route working</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppSimple;