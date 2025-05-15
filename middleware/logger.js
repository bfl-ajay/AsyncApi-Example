const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/api.log');

function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFile(logFile, `[${timestamp}] ${message}\n`, err => {
    if (err) console.error('Logging Error:', err);
  });
}

module.exports = { log };  // ✅ Export as named function
