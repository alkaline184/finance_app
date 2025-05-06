import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import ReportDetails from './pages/ReportDetails';
import Layout from './components/Layout';
import RecurringTransactions from './pages/RecurringTransactions';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:id" element={<ReportDetails />} />
          <Route path="recurring" element={<RecurringTransactions />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App; 