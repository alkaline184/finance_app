import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [newReport, setNewReport] = useState({
    name: '',
    start_date: '',
    end_date: '',
    starting_amount: '0',
  });

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports', {
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewReport({
      name: '',
      start_date: '',
      end_date: '',
      starting_amount: '0',
    });
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    try {
      const response = await fetch(`/api/reports/${reportToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
      });
      
      if (response.ok) {
        handleDeleteClose();
        fetchReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY,
        },
        body: JSON.stringify({
          ...newReport,
          starting_amount: parseFloat(newReport.starting_amount),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        handleClose();
        fetchReports();
        navigate(`/reports/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  // Function to group reports by month
  const groupReportsByMonth = (reports) => {
    const grouped = {};
    
    reports.forEach(report => {
      const date = new Date(report.start_date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(report);
    });

    // Sort months in reverse chronological order
    return Object.entries(grouped)
      .sort(([monthA], [monthB]) => {
        const dateA = new Date(monthA);
        const dateB = new Date(monthB);
        return dateB - dateA;
      });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Generate Report
        </Button>
      </Box>

      <Box>
        {groupReportsByMonth(reports).map(([month, monthReports]) => (
          <Box key={month} sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, color: 'primary.main' }}>
              {month}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              {monthReports.map((report) => (
                <Grid item xs={12} sm={6} md={4} key={report.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" gutterBottom>
                          {report.name}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(report)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Typography color="textSecondary">
                        Period: {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}
                      </Typography>
                      <Typography color="textSecondary">
                        Starting Balance: ${parseFloat(report.starting_amount).toFixed(2)}
                      </Typography>
                      <Typography color="textSecondary">
                        Total Income: ${parseFloat(report.total_income).toFixed(2)}
                      </Typography>
                      <Typography color="textSecondary">
                        Total Expense: ${parseFloat(report.total_expense).toFixed(2)}
                      </Typography>
                      <Typography variant="h6" color={(parseFloat(report.starting_amount) + parseFloat(report.net_amount)) >= 0 ? "success.main" : "error.main"}>
                        Final Balance: ${(parseFloat(report.starting_amount) + parseFloat(report.net_amount)).toFixed(2)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Generate New Report</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Report Name"
              fullWidth
              value={newReport.name}
              onChange={(e) =>
                setNewReport({ ...newReport, name: e.target.value })
              }
              required
            />
            <TextField
              type="number"
              margin="dense"
              label="Starting Amount"
              fullWidth
              value={newReport.starting_amount}
              onChange={(e) =>
                setNewReport({ ...newReport, starting_amount: e.target.value })
              }
              InputProps={{
                startAdornment: '$',
              }}
              required
            />
            <TextField
              type="date"
              margin="dense"
              label="Start Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newReport.start_date}
              onChange={(e) =>
                setNewReport({ ...newReport, start_date: e.target.value })
              }
              required
            />
            <TextField
              type="date"
              margin="dense"
              label="End Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newReport.end_date}
              onChange={(e) =>
                setNewReport({ ...newReport, end_date: e.target.value })
              }
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Generate
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the report "{reportToDelete?.name}"?
            This action cannot be undone and will delete all associated records.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Reports; 