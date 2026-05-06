// =============================================
//  XpenseLog — server.js
//  Main entry point for the Express backend
// =============================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────
app.use(cors());                            // Allow cross-origin requests
app.use(express.json());                    // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend files

// ── Routes ───────────────────────────────────
const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionRoutes);

// ── Catch-all: serve index.html for any unknown route ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ─────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`✅ XpenseLog server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} is in use, trying port ${Number(PORT) + 1}...`);
    app.listen(Number(PORT) + 1, () => {
      console.log(`✅ XpenseLog server running at http://localhost:${Number(PORT) + 1}`);
    });
  } else {
    console.error('❌ Server error:', err);
  }
});
