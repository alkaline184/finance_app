-- Add starting_amount column to reports table
ALTER TABLE reports ADD COLUMN starting_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER end_date;

-- Update existing reports to have a default starting_amount of 0
UPDATE reports SET starting_amount = 0.00 WHERE starting_amount IS NULL;

-- Remove old columns that are now calculated
ALTER TABLE reports 
  DROP COLUMN IF EXISTS total_income,
  DROP COLUMN IF EXISTS total_expense,
  DROP COLUMN IF EXISTS net_amount;

-- Create report_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS report_records (
    report_id INT NOT NULL,
    finance_record_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (report_id, finance_record_id),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_record_id) REFERENCES finance_records(id) ON DELETE CASCADE
);

-- Update finance_records table structure
ALTER TABLE finance_records
  MODIFY created_at DATETIME,
  MODIFY description TEXT,
  MODIFY category_id INT NULL;

-- Add transaction_date column to finance_records
ALTER TABLE finance_records ADD COLUMN transaction_date DATE NOT NULL AFTER category_id;

-- Update existing records to use created_at as transaction_date
UPDATE finance_records SET transaction_date = DATE(created_at) WHERE transaction_date IS NULL; 

ALTER TABLE finance_records DROP COLUMN date;

-- Add settled column to finance_records
ALTER TABLE finance_records ADD COLUMN settled BOOLEAN DEFAULT FALSE AFTER transaction_date;

-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    description TEXT,
    category_id INT,
    created_at DATETIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Add day_of_the_month field to recurring_transactions table
ALTER TABLE recurring_transactions
ADD COLUMN day_of_the_month INT,
ADD CONSTRAINT chk_day_of_month CHECK (day_of_the_month IS NULL OR (day_of_the_month >= 1 AND day_of_the_month <= 31));