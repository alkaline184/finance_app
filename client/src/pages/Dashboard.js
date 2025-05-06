import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Grid } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  annotationPlugin
);

// Disable data labels globally
ChartJS.defaults.plugins.datalabels = {
  display: false
};

const MonthlyWidget = ({ reportData, title, type, backgroundColor = 'primary.light', calculateTotal, monthOffset = 0 }) => {
  const getMonthTotal = (offset) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const targetMonth = targetDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    if (calculateTotal) {
      return calculateTotal(reportData, targetMonth);
    }

    let total = 0;
    reportData.forEach(report => {
      const reportMonth = new Date(report.start_date)
        .toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (reportMonth === targetMonth) {
        report.records.forEach(record => {
          if (record.type === type) {
            total += parseFloat(record.amount);
          }
        });
      }
    });
    
    return total;
  };

  const currentTotal = getMonthTotal(monthOffset);
  const previousTotal = getMonthTotal(monthOffset + 1);
  const isNegative = currentTotal < 0;
  const isNet = title.includes("Net");
  const today = new Date();
  const targetDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);

  // Calculate percentage change
  const calculatePercentageChange = () => {
    if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
    return ((currentTotal - previousTotal) / Math.abs(previousTotal)) * 100;
  };

  const percentageChange = calculatePercentageChange();
  const showPercentage = !isNet && monthOffset === 0;

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 3, 
      backgroundColor, 
      color: 'primary.contrastText',
      '& .amount': {
        color: isNet 
          ? (isNegative ? 'error.light' : 'success.light') 
          : 'inherit'
      },
      '& .percentage': {
        color: type === 'income' 
          ? 'white' 
          : type === 'expense'
            ? 'rgba(255, 255, 255, 0.9)'
            : percentageChange >= 0 ? 'success.light' : 'error.light',
        fontSize: '0.875rem',
        marginTop: 0.5
      }
    }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" className="amount">
        {isNegative && '-'}${Math.abs(currentTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        {showPercentage && (
          <span className="percentage">
            {' '}({percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}%)
          </span>
        )}
      </Typography>
      <Typography variant="subtitle2" sx={{ mt: 1 }}>
        {targetDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </Typography>
    </Paper>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard', {
          headers: {
            'X-API-Key': process.env.REACT_APP_API_KEY,
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch dashboard data');
        }
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const prepareChartData = () => {
    // Get last 6 months
    const today = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    }).reverse();

    // Get unique categories and create color map
    const categories = new Set();
    reportData.forEach(report => {
      report.records.forEach(record => {
        if (record.category_name) {
          categories.add(record.category_name);
        }
      });
    });

    // Sort categories to put Salary first
    const sortedCategories = Array.from(categories).sort((a, b) => {
      if (a === 'Salary') return -1;
      if (b === 'Salary') return 1;
      return a.localeCompare(b);
    });

    // Generate colors for categories
    const categoryColors = {};
    sortedCategories.forEach((category, index) => {
      if (category === 'Salary') {
        categoryColors[category] = 'hsla(145, 70%, 50%, 0.7)'; // Green color for Salary
      } else {
        const hue = (index * 137.5) % 360;
        categoryColors[category] = `hsla(${hue}, 70%, 50%, 0.7)`;
      }
    });

    // Initialize monthly data
    const monthlyData = {};
    months.forEach(month => {
      monthlyData[month] = {};
      sortedCategories.forEach(category => {
        monthlyData[month][category] = 0;
      });
    });

    // Fill in the data
    reportData.forEach(report => {
      const reportMonth = new Date(report.start_date)
        .toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (monthlyData[reportMonth]) {
        report.records.forEach(record => {
          if (record.category_name) {
            monthlyData[reportMonth][record.category_name] += parseFloat(record.amount);
          }
        });
      }
    });

    // Create datasets - one for each category
    const datasets = sortedCategories.map(category => ({
      label: category,
      data: months.map(month => monthlyData[month][category] || 0),
      backgroundColor: categoryColors[category],
      borderColor: categoryColors[category].replace('0.7', '1'),
      borderWidth: 1,
      barPercentage: 0.8,
      categoryPercentage: 0.9
    }));

    return {
      labels: months,
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center'
      },
      title: {
        display: true,
        text: 'Monthly Category Distribution (Last 6 Months)'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawBorder: false,
          color: (context) => {
            const index = context.index;
            // Draw a vertical line between every month
            if (index > 0 && index <= context.chart.data.labels.length - 1) {
              return 'rgba(0, 0, 0, 0.1)';
            }
            return 'transparent';
          },
          borderDash: [5, 5]
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    }
  };

  const calculateNetAmount = (reportData, currentMonth) => {
    let income = 0;
    let expenses = 0;
    
    reportData.forEach(report => {
      const reportMonth = new Date(report.start_date)
        .toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (reportMonth === currentMonth) {
        report.records.forEach(record => {
          if (record.type === 'income') {
            income += parseFloat(record.amount);
          } else if (record.type === 'expense') {
            expenses += parseFloat(record.amount);
          }
        });
      }
    });
    
    return income - expenses;
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const chartData = prepareChartData();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MonthlyWidget
            reportData={reportData}
            title="Current Month Income"
            type="income"
            backgroundColor="success.light"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MonthlyWidget
            reportData={reportData}
            title="Current Month Expenses"
            type="expense"
            backgroundColor="error.light"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MonthlyWidget
            reportData={reportData}
            title="Current Month Net"
            backgroundColor="info.light"
            calculateTotal={calculateNetAmount}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MonthlyWidget
            reportData={reportData}
            title="Previous Month Income"
            type="income"
            backgroundColor="success.main"
            monthOffset={1}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MonthlyWidget
            reportData={reportData}
            title="Previous Month Expenses"
            type="expense"
            backgroundColor="error.main"
            monthOffset={1}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MonthlyWidget
            reportData={reportData}
            title="Previous Month Net"
            backgroundColor="info.main"
            calculateTotal={calculateNetAmount}
            monthOffset={1}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ height: 400 }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>
      </Paper>
    </>
  );
};

export default Dashboard; 