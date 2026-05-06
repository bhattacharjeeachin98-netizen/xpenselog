// =============================================
//  XpenseLog — routes/transactions.js
//  All API routes for transactions (CRUD) using JSON db
// =============================================

const express = require('express');
const router  = express.Router();
const db      = require('../database');

// ──────────────────────────────────────────────
//  GET /api/transactions
//  Returns all transactions, newest first
//  Optional query params: ?type=expense|income  &category=Food
// ──────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { type, category } = req.query;
    let transactions = db.getTransactions();

    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type === type);
    }
    if (category && category !== 'all') {
      transactions = transactions.filter(t => t.category === category);
    }

    transactions.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date > b.date ? -1 : 1;
      }
      return (a.created_at || '').localeCompare(b.created_at || '') > 0 ? -1 : 1;
    });

    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
//  GET /api/transactions/summary
//  Returns totals: income, expense, balance
// ──────────────────────────────────────────────
router.get('/summary', (req, res) => {
  try {
    const transactions = db.getTransactions();
    
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    const byCat = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
    });
    
    const byCategory = Object.keys(byCat).map(cat => ({
      category: cat, total: byCat[cat]
    })).sort((a, b) => b.total - a.total).slice(0, 6);

    res.json({
      success: true,
      data: {
        income,
        expense,
        balance: income - expense,
        byCategory,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
//  POST /api/transactions
//  Create a new transaction
//  Body: { desc, amount, category, date, type }
// ──────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const { desc, amount, category, date, type } = req.body;

    // Validation
    if (!desc || !amount || !category || !date || !type) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense.' });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    let transactions = db.getTransactions();
    const id = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
    
    const newTx = {
      id, 
      desc, 
      amount: Number(amount), 
      category, 
      date, 
      type, 
      created_at: new Date().toISOString()
    };
    
    transactions.push(newTx);
    db.saveTransactions(transactions);

    res.status(201).json({ success: true, data: newTx });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
//  DELETE /api/transactions/:id
//  Delete a transaction by ID
// ──────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    let transactions = db.getTransactions();
    
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    transactions.splice(index, 1);
    db.saveTransactions(transactions);
    
    res.json({ success: true, message: 'Transaction deleted successfully.' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ──────────────────────────────────────────────
//  PUT /api/transactions/:id
//  Update an existing transaction
// ──────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { desc, amount, category, date, type } = req.body;

    // Validation
    if (!desc || !amount || !category || !date || !type) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense.' });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    let transactions = db.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    transactions[index] = {
      ...transactions[index],
      desc, 
      amount: Number(amount), 
      category, 
      date, 
      type
    };
    
    db.saveTransactions(transactions);

    res.json({ success: true, data: transactions[index] });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
