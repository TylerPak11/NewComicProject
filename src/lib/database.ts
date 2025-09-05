import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Get database path - check if running in Electron
function getDatabasePath() {
  // Check if we have the Electron-provided database path
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  } else {
    // In regular web/development environment
    return path.join(process.cwd(), 'comics.db');
  }
}

const dbPath = getDatabasePath();

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database;
try {
  console.log('Attempting to open database at:', dbPath);
  db = new Database(dbPath);
  console.log('Database opened successfully');
} catch (error) {
  console.error('Failed to open database:', error);
  throw error;
}

export function initializeDatabase() {
  db.exec(`
    -- Publishers table
    CREATE TABLE IF NOT EXISTS publishers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Series table
    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      publisher_id INTEGER NOT NULL,
      total_issues INTEGER DEFAULT 0,
      locg_link TEXT,
      locg_issue_count INTEGER DEFAULT NULL,
      last_crawled TEXT DEFAULT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (publisher_id) REFERENCES publishers (id) ON DELETE CASCADE
    );

    -- Issues table
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      series_id INTEGER NOT NULL,
      issue_no INTEGER NOT NULL,
      publisher_id INTEGER NOT NULL,
      variant_description TEXT,
      cover_url TEXT,
      release_date TEXT,
      upc TEXT,
      locg_link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_id) REFERENCES series (id) ON DELETE CASCADE,
      FOREIGN KEY (publisher_id) REFERENCES publishers (id) ON DELETE CASCADE
    );

    -- Wishlist table
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      series_id INTEGER NOT NULL,
      issue_no INTEGER NOT NULL,
      publisher_id INTEGER NOT NULL,
      variant_description TEXT,
      cover_url TEXT,
      release_date TEXT,
      upc TEXT,
      locg_link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_id) REFERENCES wishlist_series (id) ON DELETE CASCADE,
      FOREIGN KEY (publisher_id) REFERENCES wishlist_publishers (id) ON DELETE CASCADE
    );

    -- Wishlist Publishers table
    CREATE TABLE IF NOT EXISTS wishlist_publishers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Wishlist Series table
    CREATE TABLE IF NOT EXISTS wishlist_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      publisher_id INTEGER NOT NULL,
      total_issues INTEGER DEFAULT 0,
      locg_link TEXT,
      locg_issue_count INTEGER DEFAULT NULL,
      last_crawled TEXT DEFAULT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (publisher_id) REFERENCES wishlist_publishers (id) ON DELETE CASCADE
    );

    -- Legacy comic_series table for backward compatibility
    CREATE TABLE IF NOT EXISTS comic_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      publisher TEXT NOT NULL,
      start_year INTEGER,
      end_year INTEGER,
      cover_image TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Legacy comic_issues table for backward compatibility
    CREATE TABLE IF NOT EXISTS comic_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id INTEGER NOT NULL,
      issue_number TEXT NOT NULL,
      title TEXT,
      release_date TEXT,
      cover_date TEXT,
      cover_image TEXT,
      description TEXT,
      rating REAL,
      isbn TEXT,
      upc TEXT,
      price REAL,
      page_count INTEGER,
      writers TEXT,
      artists TEXT,
      colorists TEXT,
      letterers TEXT,
      editors TEXT,
      variant BOOLEAN DEFAULT 0,
      in_collection BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (series_id) REFERENCES comic_series (id) ON DELETE CASCADE
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_series_publisher_id ON series(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_issues_series_id ON issues(series_id);
    CREATE INDEX IF NOT EXISTS idx_issues_publisher_id ON issues(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_series_id ON wishlist(series_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_publisher_id ON wishlist(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_publishers_name ON publishers(name);
    CREATE INDEX IF NOT EXISTS idx_series_name ON series(name);
    CREATE INDEX IF NOT EXISTS idx_wishlist_publishers_name ON wishlist_publishers(name);
    CREATE INDEX IF NOT EXISTS idx_wishlist_series_name ON wishlist_series(name);
    CREATE INDEX IF NOT EXISTS idx_wishlist_series_publisher_id ON wishlist_series(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_comic_series_title ON comic_series(title);
    CREATE INDEX IF NOT EXISTS idx_comic_issues_series_id ON comic_issues(series_id);

    -- Add new columns if they don't exist (for existing databases)
  `);

  // Add new columns to existing tables if they don't exist
  try {
    db.exec('ALTER TABLE series ADD COLUMN start_date TEXT');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE series ADD COLUMN end_date TEXT');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE wishlist_series ADD COLUMN start_date TEXT');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE wishlist_series ADD COLUMN end_date TEXT');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE issues ADD COLUMN plot TEXT');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE wishlist ADD COLUMN plot TEXT');
  } catch (error) {
    // Column already exists, ignore
  }

  // Add new columns for LOCG crawler
  try {
    db.exec('ALTER TABLE series ADD COLUMN locg_issue_count INTEGER DEFAULT NULL');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE series ADD COLUMN last_crawled TEXT DEFAULT NULL');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE wishlist_series ADD COLUMN locg_issue_count INTEGER DEFAULT NULL');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE wishlist_series ADD COLUMN last_crawled TEXT DEFAULT NULL');
  } catch (error) {
    // Column already exists, ignore
  }

  // Add run field for year ranges
  try {
    db.exec('ALTER TABLE series ADD COLUMN run TEXT DEFAULT NULL');
    console.log('Added run column to series table');
  } catch (error) {
    // Column already exists, ignore
  }

  try {
    db.exec('ALTER TABLE wishlist_series ADD COLUMN run TEXT DEFAULT NULL');
    console.log('Added run column to wishlist_series table');
  } catch (error) {
    // Column already exists, ignore
  }

  return db;
}

export default db;