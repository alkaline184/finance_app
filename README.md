# Finance Records API

A Node.js application for managing financial records with MySQL database.

## Prerequisites

- Node.js
- MySQL

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your database configuration:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=finance_db
   PORT=3000
   API_KEY=your_secure_api_key_here
   ```
4. Set up the database:
   - Log in to MySQL
   - Run the commands in `database.sql`

## Running the Application

```bash
node app.js
```

## Authentication

All API endpoints require authentication using an API key. The API key should be included in the request headers:

```
X-API-Key: your_secure_api_key_here
```

If the API key is missing or invalid, the request will be rejected with an appropriate error message.

## API Endpoints

### Categories

#### Create a Category
- **POST** `/api/categories`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Body:
  ```json
  {
    "name": "Salary"
  }
  ```

#### Get All Categories
- **GET** `/api/categories`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```

#### Update a Category
- **PUT** `/api/categories/:id`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Body:
  ```json
  {
    "name": "Updated Category Name"
  }
  ```

#### Delete a Category
- **DELETE** `/api/categories/:id`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```

### Finance Records

#### Create a Finance Record
- **POST** `/api/finances`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Body:
  ```json
  {
    "description": "Monthly Salary",
    "amount": 5000.00,
    "type": "income",
    "date": "2024-03-15",
    "category_id": 1
  }
  ```

#### Get All Finance Records
- **GET** `/api/finances`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Returns records with category names included

#### Get Single Finance Record
- **GET** `/api/finances/:id`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Returns record with category name included

#### Update Finance Record
- **PUT** `/api/finances/:id`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Body: (same as create)

#### Delete Finance Record
- **DELETE** `/api/finances/:id`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```

### Reports

#### Create a Report
- **POST** `/api/reports`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Body:
  ```json
  {
    "name": "March 2024 Report",
    "start_date": "2024-03-01",
    "end_date": "2024-03-31"
  }
  ```
- Response includes:
  - Total income
  - Total expenses
  - Net amount
  - Number of records included

#### Get All Reports
- **GET** `/api/reports`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Returns list of all reports with their summaries

#### Get Single Report
- **GET** `/api/reports/:id`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Returns report details with all included finance records

#### Delete Report
- **DELETE** `/api/reports/:id`
- Headers:
  ```
  X-API-Key: your_secure_api_key_here
  ```
- Deletes the report (finance records remain untouched) 