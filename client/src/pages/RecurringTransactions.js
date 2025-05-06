import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function RecurringTransactions() {
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    amount: '',
    description: '',
    type: 'expense',
    category_id: '',
    day_of_the_month: ''
  });

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/recurring', {
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchCategories();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewRecord({
      amount: '',
      description: '',
      type: 'expense',
      category_id: '',
      day_of_the_month: ''
    });
  };

  const handleEditClick = (record) => {
    setSelectedRecord(record);
    setEditOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_API_KEY
        },
        body: JSON.stringify(newRecord)
      });
      if (response.ok) {
        handleClose();
        fetchRecords();
      }
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const response = await fetch(`/api/recurring/${selectedRecord.id}`, {
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
          day_of_the_month: selectedRecord.day_of_the_month
        })
      });

      if (response.ok) {
        setEditOpen(false);
        fetchRecords();
      }
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/recurring/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': process.env.REACT_APP_API_KEY
        }
      });

      if (response.ok) {
        setDeleteOpen(false);
        fetchRecords();
      }
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Recurring Transactions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add New
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Day of Month</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.description}</TableCell>
                <TableCell>{record.category_name}</TableCell>
                <TableCell>{record.type}</TableCell>
                <TableCell>{record.day_of_the_month || 'Any'}</TableCell>
                <TableCell align="right" sx={{ color: record.type === 'income' ? 'green' : 'red' }}>
                  {record.type === 'income' ? '+' : '-'}${Math.abs(record.amount).toFixed(2)}
                </TableCell>
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

      {/* Add New Record Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Recurring Transaction</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              select
              margin="dense"
              label="Type"
              fullWidth
              value={newRecord.type}
              onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
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
              onChange={(e) => setNewRecord({ ...newRecord, category_id: e.target.value })}
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
              onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
              required
            />
            <TextField
              type="number"
              margin="dense"
              label="Day of Month"
              fullWidth
              value={newRecord.day_of_the_month}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                  setNewRecord({ ...newRecord, day_of_the_month: value });
                }
              }}
              inputProps={{ min: 1, max: 31 }}
              helperText="Leave empty for any day, or enter a day (1-31)"
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Add</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Recurring Transaction</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="Type"
            fullWidth
            value={selectedRecord?.type || ''}
            onChange={(e) => setSelectedRecord({ ...selectedRecord, type: e.target.value })}
          >
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="income">Income</MenuItem>
          </TextField>
          <TextField
            select
            margin="dense"
            label="Category"
            fullWidth
            value={selectedRecord?.category_id || ''}
            onChange={(e) => setSelectedRecord({ ...selectedRecord, category_id: e.target.value })}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={selectedRecord?.amount || ''}
            onChange={(e) => setSelectedRecord({ ...selectedRecord, amount: e.target.value })}
          />
          <TextField
            type="number"
            margin="dense"
            label="Day of Month"
            fullWidth
            value={selectedRecord?.day_of_the_month || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                setSelectedRecord({ ...selectedRecord, day_of_the_month: value });
              }
            }}
            inputProps={{ min: 1, max: 31 }}
            helperText="Leave empty for any day, or enter a day (1-31)"
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={selectedRecord?.description || ''}
            onChange={(e) => setSelectedRecord({ ...selectedRecord, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Recurring Transaction</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this recurring transaction? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default RecurringTransactions; 