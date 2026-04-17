import Database from 'better-sqlite3';

export function initializeDatabase() {
  const db = new Database('data_vault.db');

  // Create the table
  db.exec(`
    DROP TABLE IF EXISTS EMPLOYEES;
    CREATE TABLE EMPLOYEES (
      NAME TEXT,
      DEPARTMENT TEXT,
      ROLE TEXT,
      SALARY INTEGER
    );
  `);

  // Insert sample records
  const insert = db.prepare('INSERT INTO EMPLOYEES (NAME, DEPARTMENT, ROLE, SALARY) VALUES (?, ?, ?, ?)');

  const sampleData = [
    ['Arun', 'Data Science', 'Manager', 95000],
    ['Priya', 'Data Science', 'Developer', 75000],
    ['Vijay', 'DevOps', 'Engineer', 80000],
    ['Deepa', 'HR', 'Lead', 65000],
    ['Senthil', 'DevOps', 'Manager', 98000],
    ['Anjali', 'Marketing', 'Specialist', 60000],
    ['Rahul', 'Engineering', 'Senior Developer', 110000]
  ];

  for (const row of sampleData) {
    insert.run(row);
  }

  console.log('Database initialized with sample records.');
  
  // Verify data
  const rows = db.prepare('SELECT * FROM EMPLOYEES').all();
  console.log('Sample Data:', rows);

  db.close();
}

// Run if called directly
if (import.meta.url.endsWith('db-setup.ts')) {
  initializeDatabase();
}
