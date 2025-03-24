const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('dotenv').config();

// Increase the heap size limit
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

const app = express();

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process here, just log it
});

// Load swagger document with error handling
let swaggerDocument;
try {
  swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
} catch (error) {
  console.error('Error loading Swagger document:', error);
  swaggerDocument = {};
}

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument));

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API Key is missing' });
    }

    if (apiKey !== process.env.API_KEY) {
      return res.status(403).json({ error: 'Invalid API Key' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Apply authentication to all /api routes
app.use('/api', authenticateApiKey);

// Create MySQL connection pool with error handling
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Category Routes

// Create a new category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created successfully' });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Error creating category' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// Update a category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Error updating category' });
  }
});

// Delete a category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Error deleting category' });
  }
});

// Finance Record Routes

// Create a new finance record
app.post('/api/finances', async (req, res) => {
  try {
    const { description, amount, type, date, category_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO finance_records (description, amount, type, transaction_date, category_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [description, amount, type, date, category_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Record created successfully' });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: 'Error creating record' });
  }
});

// Get all finance records with category names
app.get('/api/finances', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.*, c.name as category_name 
      FROM finance_records f 
      JOIN categories c ON f.category_id = c.id 
      ORDER BY f.transaction_date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Error fetching records' });
  }
});

// Get a single finance record with category name
app.get('/api/finances/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.*, c.name as category_name 
      FROM finance_records f 
      JOIN categories c ON f.category_id = c.id 
      WHERE f.id = ?
    `, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: 'Error fetching record' });
  }
});

// Update a finance record
app.put('/api/finances/:id', async (req, res) => {
  try {
    const { description, amount, type, date, category_id } = req.body;
    const [result] = await pool.execute(
      'UPDATE finance_records SET description = ?, amount = ?, type = ?, transaction_date = ?, category_id = ? WHERE id = ?',
      [description, amount, type, date, category_id, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Error updating record' });
  }
});

// Delete a finance record
app.delete('/api/finances/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM finance_records WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Error deleting record' });
  }
});

// Update a finance record's settled status
app.patch('/api/finances/:id/settled', async (req, res) => {
  try {
    const { settled } = req.body;
    const [result] = await pool.execute(
      'UPDATE finance_records SET settled = ? WHERE id = ?',
      [settled, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating record settled status:', error);
    res.status(500).json({ error: 'Error updating record' });
  }
});

// Report Routes

// Create a new report
app.post('/api/reports', authenticateApiKey, async (req, res) => {
  try {
    const { name, start_date, end_date, starting_amount } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reports (name, start_date, end_date, starting_amount) VALUES (?, ?, ?, ?)',
      [name, start_date, end_date, starting_amount || 0]
    );
    const reportId = result.insertId;
    const [report] = await pool.query('SELECT * FROM reports WHERE id = ?', [reportId]);
    res.json(report[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Error creating report' });
  }
});

// Get all reports
app.get('/api/reports', authenticateApiKey, async (req, res) => {
  try {
    const [reports] = await pool.query(`
      SELECT 
        r.*,
        COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN f.type = 'expense' THEN f.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE -f.amount END), 0) as net_amount
      FROM reports r
      LEFT JOIN report_records rr ON r.id = rr.report_id
      LEFT JOIN finance_records f ON f.id = rr.finance_record_id
      GROUP BY r.id, r.name, r.start_date, r.end_date, r.starting_amount, r.created_at, r.updated_at
      ORDER BY r.created_at DESC
    `);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

// Get a specific report
app.get('/api/reports/:id', authenticateApiKey, async (req, res) => {
  try {
    const [[report]] = await pool.query(`
      SELECT 
        r.*,
        COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN f.type = 'expense' THEN f.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE -f.amount END), 0) as net_amount,
        (r.starting_amount + COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE -f.amount END), 0)) as total_balance
      FROM reports r
      LEFT JOIN report_records rr ON r.id = rr.report_id
      LEFT JOIN finance_records f ON f.id = rr.finance_record_id
      WHERE r.id = ?
      GROUP BY r.id, r.name, r.start_date, r.end_date, r.starting_amount, r.created_at, r.updated_at
    `, [req.params.id]);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get the records for this report
    const [records] = await pool.query(`
      SELECT 
        f.*,
        c.name as category_name,
        (
          SELECT 
            r.starting_amount + COALESCE(SUM(CASE WHEN f2.type = 'income' THEN f2.amount ELSE -f2.amount END), 0)
          FROM reports r
          LEFT JOIN report_records rr2 ON r.id = rr2.report_id
          LEFT JOIN finance_records f2 ON f2.id = rr2.finance_record_id
          WHERE r.id = ? AND (f2.transaction_date <= f.transaction_date OR f2.id IS NULL)
          GROUP BY r.id
        ) as running_balance
      FROM finance_records f
      JOIN report_records rr ON f.id = rr.finance_record_id
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE rr.report_id = ?
      ORDER BY f.transaction_date ASC
    `, [req.params.id, req.params.id]);

    res.json({
      ...report,
      records: records.map(record => ({
        ...record,
        running_balance: parseFloat(record.running_balance).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Error fetching report' });
  }
});

// Update a report
app.put('/api/reports/:id', authenticateApiKey, async (req, res) => {
  try {
    const { name, start_date, end_date, starting_amount } = req.body;
    const [result] = await pool.query(
      'UPDATE reports SET name = ?, start_date = ?, end_date = ?, starting_amount = ? WHERE id = ?',
      [name, start_date, end_date, starting_amount, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const [[updatedReport]] = await pool.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Error updating report' });
  }
});

// Delete a report
app.delete('/api/reports/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM reports WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Error deleting report' });
  }
});

// Add a new record to a report
app.post('/api/reports/:id/records', authenticateApiKey, async (req, res) => {
  try {
    const { amount, description, type, category_id, date } = req.body;
    
    // First create the finance record
    const [result] = await pool.query(
      'INSERT INTO finance_records (amount, description, type, category_id, transaction_date, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [amount, description, type, category_id, date]
    );

    // Then link it to the report
    await pool.query(
      'INSERT INTO report_records (report_id, finance_record_id) VALUES (?, ?)',
      [req.params.id, result.insertId]
    );

    // Get the created record with category name
    const [records] = await pool.query(`
      SELECT f.*, c.name as category_name
      FROM finance_records f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.id = ?
    `, [result.insertId]);

    res.json(records[0]);
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: 'Error creating record' });
  }
});

const port = process.env.EXPRESS_PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    pool.end().then(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
}); 