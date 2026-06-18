const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'vector_db.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  db.all("SELECT * FROM documents", [], (err, rows) => {
    if (err) {
      console.error('Error querying documents:', err);
      return;
    }
    console.log('\n--- DOCUMENTS ---');
    console.log(JSON.stringify(rows, null, 2));
    
    // Check if files exist on disk
    if (rows && rows.length > 0) {
      console.log('\n--- FILE EXISTENCE CHECK ---');
      rows.forEach(row => {
        if (row.url) {
          const filePath = path.join(__dirname, row.url);
          console.log(`File: ${row.filename} -> URL: ${row.url} -> Exists on disk? ${fs.existsSync(filePath)}`);
        } else {
          console.log(`File: ${row.filename} -> No URL`);
        }
      });
    }
    
    db.close();
  });
});
