// =============================================
//  XpenseLog — database.js
//  Simple JSON-based database to avoid native
//  dependency compilation issues across environments.
// =============================================

const fs = require('fs');
const path = require('path');

// Database file will be created at: xpenselog/xpenselog.json
const dataFile = path.join(__dirname, 'xpenselog.json');

// Ensure data file exists
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
}

const getTransactions = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (err) {
    return [];
  }
};

const saveTransactions = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

console.log('✅ Database connected — xpenselog.json ready');

module.exports = {
  getTransactions,
  saveTransactions
};
