# XpenseLog 💸
> Daily Expense Tracker — Node.js + Express + SQLite

---

## 📁 Project Structure

```
xpenselog/
├── server.js              ← Main Express server (entry point)
├── database.js            ← SQLite database setup
├── package.json           ← Dependencies & scripts
├── xpenselog.db           ← SQLite database (auto-created on first run)
├── routes/
│   └── transactions.js    ← All API routes (GET, POST, DELETE)
└── public/
    └── index.html         ← Frontend (HTML + CSS + JS)
```

---

## 🚀 How to Run

### 1. Open the project in VS Code
```
Open folder → xpenselog/
```

### 2. Install dependencies
Open the Terminal in VS Code (`Ctrl + ~`) and run:
```bash
npm install
```

### 3. Start the server
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

### 4. Open the app
Go to your browser and visit:
```
http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint                    | Description                        |
|--------|-----------------------------|------------------------------------|
| GET    | /api/transactions           | Get all transactions (with filters)|
| GET    | /api/transactions/summary   | Get income, expense, balance totals|
| POST   | /api/transactions           | Add a new transaction              |
| DELETE | /api/transactions/:id       | Delete a transaction by ID         |

### Filter Examples
```
GET /api/transactions?type=expense
GET /api/transactions?type=income&category=Food
```

### POST Body Example
```json
{
  "desc": "Lunch at canteen",
  "amount": 80,
  "category": "Food",
  "date": "2025-05-06",
  "type": "expense"
}
```

---

## 🛠️ Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Node.js + Express.js              |
| Database | SQLite (via better-sqlite3)       |
| Frontend | HTML + CSS + Vanilla JavaScript   |
| Icons    | Tabler Icons                      |
| Fonts    | Syne + DM Sans (Google Fonts)     |

---

## 📦 Dependencies

```json
"express"        → Web server framework
"better-sqlite3" → Fast SQLite database
"cors"           → Allow cross-origin requests
"nodemon"        → Auto-restart server on file changes (dev only)
```

---

Made with ❤️ for College Project
