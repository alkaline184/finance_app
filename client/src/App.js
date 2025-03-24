import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import ReportDetails from './pages/ReportDetails';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/reports" replace />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportDetails />} />
      </Routes>
    </Layout>
  );
}

export default App; 