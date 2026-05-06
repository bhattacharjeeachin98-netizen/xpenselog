// =============================================
//  XpenseLog — database.js
//  Simple JSON-based database to avoid native
//  dependency compilation issues across environments.
// =============================================

const fs = require('fs');
const path = require('path');

// On Vercel, the filesystem is read-only except /tmp
// Use /tmp for the data file in production, local path in development
const isVercel = process.env.VERCEL === '1';
const dataFile = isVercel
  ? path.join('/tmp', 'xpenselog.json')
  : path.join(__dirname, 'xpenselog.json');

// Ensure data file exists
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
}

const getTransactions = () => {
  try {
    if (!fs.existsSync(dataFile)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (err) {
    return [];
  }
};

const saveTransactions = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

console.log(`✅ Database connected — ${isVercel ? '/tmp/xpenselog.json' : 'xpenselog.json'} ready`);

module.exports = {
  getTransactions,
  saveTransactions
};
