import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  DialogContentText,
  Checkbox,
  Tooltip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ChartDataLabels
);

function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editReportOpen, setEditReportOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editedReport, setEditedReport] = useState(null);
  const [newRecord, setNewRecord] = useState({
    amount: '',
    description: '',
    type: 'expense',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [categoryTotals, setCategoryTotals] = useState({ income: {}, expense: {} });
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [selectedRecurring, setSelectedRecurring] = useState([]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReport(data);
        setRecords(data.records || []);
        calculateCategoryTotals(data.records);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRecurringTransactions = async () => {
    try {
      const response = await fetch('/api/recurring', {
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRecurringTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchCategories();
    fetchRecurringTransactions();
  }, [id]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewRecord({
      amount: '',
      description: '',
      type: 'expense',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditClick = (record) => {
    setSelectedRecord({
      ...record,
      date: new Date(record.transaction_date).toISOString().split('T')[0]
    });
    setEditOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await fetch(`/api/finances/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY
        },
        body: JSON.stringify({
          description: selectedRecord.description,
          amount: selectedRecord.amount,
          type: selectedRecord.type,
          category_id: selectedRecord.category_id,
          date: selectedRecord.date
        })
      });

      if (response.ok) {
        setEditOpen(false);
        fetchReport();
      } else {
        console.error('Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/finances/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY
        }
      });

      if (response.ok) {
        setDeleteOpen(false);
        fetchReport();
      } else {
        console.error('Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/reports/${id}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify(newRecord),
      });
      if (response.ok) {
        handleClose();
        fetchReport();
      }
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const handleSettledToggle = async (record) => {
    try {
      const response = await fetch(`/api/finances/${record.id}/settled`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY
        },
        body: JSON.stringify({
          settled: !record.settled
        })
      });

      if (response.ok) {
        fetchReport(); // Refresh the data
      } else {
        console.error('Failed to update settled status');
      }
    } catch (error) {
      console.error('Error updating settled status:', error);
    }
  };

  const handleEditReportClick = () => {
    setEditedReport({
      ...report,
      start_date: report.start_date.split('T')[0],
      end_date: report.end_date.split('T')[0]
    });
    setEditReportOpen(true);
  };

  const handleEditReportSubmit = async () => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY
        },
        body: JSON.stringify({
          name: editedReport.name,
          start_date: editedReport.start_date,
          end_date: editedReport.end_date,
          starting_amount: editedReport.starting_amount
        })
      });

      if (response.ok) {
        setEditReportOpen(false);
        fetchReport();
      } else {
        console.error('Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const calculateCategoryTotals = (records) => {
    const totals = {
      income: {},
      expense: {}
    };

    records.forEach(record => {
      const type = record.type;
      const category = record.category_name;
      const amount = parseFloat(record.amount);

      if (!totals[type][category]) {
        totals[type][category] = 0;
      }
      totals[type][category] += amount;
    });

    setCategoryTotals(totals);
  };

  const prepareChartData = () => {
    // Combine all categories
    const allCategories = new Set([
      ...Object.keys(categoryTotals.income),
      ...Object.keys(categoryTotals.expense)
    ]);

    // Create data array with single bars
    const data = Array.from(allCategories).map(category => {
      const incomeAmount = categoryTotals.income[category] || 0;
      const expenseAmount = categoryTotals.expense[category] || 0;
      
      return {
        category,
        amount: incomeAmount || expenseAmount,
        isIncome: incomeAmount > 0
      };
    });

    return {
      labels: data.map(item => item.category),
      datasets: [
        {
          label: 'Amount',
          data: data.map(item => Math.abs(item.amount)),
          backgroundColor: data.map(item => 
            item.isIncome ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)'
          ),
          borderColor: data.map(item => 
            item.isIncome ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
          ),
          borderWidth: 1,
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: (value) => `$${value.toFixed(2)}`,
            color: data.map(item => 
              item.isIncome ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
            ),
            font: {
              weight: 'bold'
            }
          }
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Category Amounts'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const dataIndex = context.dataIndex;
            const isIncome = context.dataset.backgroundColor[dataIndex].includes('192'); // Check if it's the green color
            const type = isIncome ? 'Income' : 'Expense';
            return `${type}: $${context.raw.toFixed(2)}`;
          }
        }
      }
    }
  };

  const handleRecurringOpen = () => setRecurringOpen(true);
  
  const handleRecurringClose = () => {
    setRecurringOpen(false);
    setSelectedRecurring([]);
  };

  const handleRecurringToggle = (transaction) => {
    setSelectedRecurring(prev => {
      const isSelected = prev.find(t => t.id === transaction.id);
      if (isSelected) {
        return prev.filter(t => t.id !== transaction.id);
      } else {
        return [...prev, transaction];
      }
    });
  };

  const calculateTransactionDate = (dayOfMonth, startDate) => {
    if (!dayOfMonth) return new Date().toISOString().split('T')[0];
    
    const reportStartDate = new Date(startDate);
    const transactionDate = new Date(
      reportStartDate.getFullYear(),
      reportStartDate.getMonth(),
      dayOfMonth
    );
    
    // If the day is greater than the days in the month, set to the last day
    const lastDayOfMonth = new Date(
      reportStartDate.getFullYear(),
      reportStartDate.getMonth() + 1,
      0
    ).getDate();
    
    if (dayOfMonth > lastDayOfMonth) {
      transactionDate.setDate(lastDayOfMonth);
    }
    
    return transactionDate.toISOString().split('T')[0];
  };

  const handleAddRecurring = async () => {
    try {
      const recordsToAdd = selectedRecurring.map(transaction => ({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category_id: transaction.category_id,
        date: calculateTransactionDate(transaction.day_of_the_month, report.start_date)
      }));

      const response = await fetch(`/api/reports/${id}/records/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify({ records: recordsToAdd }),
      });

      if (response.ok) {
        handleRecurringClose();
        fetchReport();
      }
    } catch (error) {
      console.error('Error adding recurring transactions:', error);
    }
  };

  if (!report) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h4">
                {report.name}
              </Typography>
              <IconButton onClick={handleEditReportClick} size="small" color="primary">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => setDeleteOpen(true)} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
            <Typography color="textSecondary" gutterBottom>
              Period: {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
            </Typography>
            <Typography variant="h6" gutterBottom>
              Starting Balance: ${parseFloat(report.starting_amount).toFixed(2)}
            </Typography>
            <Typography variant="h6" sx={{ color: 'success.main' }} gutterBottom>
              Total Income: ${parseFloat(report.total_income).toFixed(2)}
            </Typography>
            <Typography variant="h6" sx={{ color: 'error.main' }} gutterBottom>
              Total Expense: ${parseFloat(report.total_expense).toFixed(2)}
            </Typography>
            <Typography variant="h6" sx={{ color: parseFloat(report.net_amount) >= 0 ? 'success.main' : 'error.main' }} gutterBottom>
              Net Amount: ${parseFloat(report.net_amount).toFixed(2)}
            </Typography>
            <Typography variant="h5" sx={{ color: (parseFloat(report.starting_amount) + parseFloat(report.net_amount)) >= 0 ? 'success.main' : 'error.main' }}>
              Final Balance: ${(parseFloat(report.starting_amount) + parseFloat(report.net_amount)).toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 400, p: 2 }}>
            <Bar options={chartOptions} data={prepareChartData()} />
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Record
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleRecurringOpen}
        >
          Add Recurring
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Settled</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {report?.records?.map((record) => (
              <TableRow 
                key={record.id}
                sx={{ 
                  backgroundColor: record.settled ? 'rgba(33, 150, 243, 0.1)' : 'inherit'
                }}
              >
                <TableCell>
                  <Tooltip title={record.settled ? "Mark as unsettled" : "Mark as settled"}>
                    <Checkbox
                      checked={record.settled}
                      onChange={() => handleSettledToggle(record)}
                      color="primary"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>{new Date(record.transaction_date).toLocaleDateString()}</TableCell>
                <TableCell>{record.category_name}</TableCell>
                <TableCell>{record.description}</TableCell>
                <TableCell align="right" sx={{ color: record.type === 'income' ? 'green' : 'red' }}>
                  {record.type === 'income' ? '+' : '-'}${Math.abs(record.amount).toFixed(2)}
                </TableCell>
                <TableCell align="right">${record.running_balance}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleEditClick(record)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(record)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Record</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              type="date"
              margin="dense"
              label="Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newRecord.date}
              onChange={(e) =>
                setNewRecord({ ...newRecord, date: e.target.value })
              }
              required
            />
            <TextField
              select
              margin="dense"
              label="Type"
              fullWidth
              value={newRecord.type}
              onChange={(e) =>
                setNewRecord({ ...newRecord, type: e.target.value })
              }
              required
            >
              <MenuItem value="expense">Expense</MenuItem>
              <MenuItem value="income">Income</MenuItem>
            </TextField>
            <TextField
              select
              margin="dense"
              label="Category"
              fullWidth
              value={newRecord.category_id}
              onChange={(e) =>
                setNewRecord({ ...newRecord, category_id: e.target.value })
              }
              required
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              margin="dense"
              label="Amount"
              fullWidth
              value={newRecord.amount}
              onChange={(e) =>
                setNewRecord({ ...newRecord, amount: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={newRecord.description}
              onChange={(e) =>
                setNewRecord({ ...newRecord, description: e.target.value })
              }
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={selectedRecord?.date || ''}
            onChange={(e) => setSelectedRecord({ ...selectedRecord, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedRecord?.type || ''}
              onChange={(e) => setSelectedRecord({ ...selectedRecord, type: e.target.value })}
              label="Type"
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedRecord?.category_id || ''}
              onChange={(e) => setSelectedRecord({ ...selectedRecord, category_id: e.target.value })}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={selectedRecord?.amount || ''}
            onChange={(e) => setSelectedRecord({ ...selectedRecord, amount: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={selectedRecord?.description || ''}
            onChange={(e) => setSelectedRecord({ ...selectedRecord, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this record? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editReportOpen} onClose={() => setEditReportOpen(false)}>
        <DialogTitle>Edit Report</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={editedReport?.name || ''}
            onChange={(e) => setEditedReport({ ...editedReport, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            value={editedReport?.start_date || ''}
            onChange={(e) => setEditedReport({ ...editedReport, start_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="date"
            fullWidth
            value={editedReport?.end_date || ''}
            onChange={(e) => setEditedReport({ ...editedReport, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Starting Amount"
            type="number"
            fullWidth
            value={editedReport?.starting_amount || ''}
            onChange={(e) => setEditedReport({ ...editedReport, starting_amount: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditReportOpen(false)}>Cancel</Button>
          <Button onClick={handleEditReportSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={recurringOpen} onClose={handleRecurringClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Recurring Transactions</DialogTitle>
        <DialogContent>
          <List>
            {recurringTransactions.map((transaction) => (
              <ListItem
                key={transaction.id}
                onClick={() => handleRecurringToggle(transaction)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={selectedRecurring.some(t => t.id === transaction.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleRecurringToggle(transaction);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={transaction.description}
                  secondary={`${transaction.type === 'income' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)} | ${transaction.category_name} | ${transaction.day_of_the_month ? `Day: ${transaction.day_of_the_month}` : 'Any day'}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRecurringClose}>Cancel</Button>
          <Button
            onClick={handleAddRecurring}
            variant="contained"
            disabled={selectedRecurring.length === 0}
          >
            Add Selected ({selectedRecurring.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReportDetails; 