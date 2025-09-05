const { app } = require('electron');
const path = require('path');
const fs = require('fs');

function getDatabasePath() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // In development, use the project root
    return path.join(process.cwd(), 'comics.db');
  } else {
    // In production, use the app's userData directory
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'comics.db');
    
    // If database doesn't exist in userData, copy from resources
    if (!fs.existsSync(dbPath)) {
      const resourcesPath = process.resourcesPath || path.join(process.cwd(), 'resources');
      const sourceDbPath = path.join(resourcesPath, 'comics.db');
      
      try {
        if (fs.existsSync(sourceDbPath)) {
          fs.copyFileSync(sourceDbPath, dbPath);
        }
      } catch (error) {
        console.log('Note: No existing database found, will create new one');
      }
    }
    
    return dbPath;
  }
}

module.exports = {
  getDatabasePath
};