# SettleUp 💰

> A full-stack personal finance and group expense management web application implementing modern JavaScript, Node.js, Express.js, MongoDB, and React (Lectures 1–48).

---

## 🌟 Key Features

### 1. 📊 Personal Finance Management
- **Live Dashboard**: Aggregated summary of total income, total expenses, net balance, category-wise breakdown, and recent transactions powered by MongoDB aggregation pipelines.
- **Transactions CRUD**: Record, edit, and delete income and expense entries with amount, category, date, and description.
- **Search, Filter & Sort**: Real-time filtering by transaction type (income/expense), category, description keyword search, and sorting by date or amount.

### 2. 👥 Group Expense Splitting & Debt Simplification
- **Group Management**: Create groups (e.g. "Flat 402", "Goa Trip"), invite members by email, and view member roles.
- **Equal & Custom Splits**: Support for equal splitting and custom monetary shares with integer-paise arithmetic (`amount * 100`) to completely eliminate floating-point rounding errors.
- **Greedy Settlement Engine**: Real-time net balance calculations and an optimal repayment plan (minimum number of transactions) generated via a greedy debtor-creditor algorithm.
- **Zero Double-Counting**: Group expenses remain distinct from personal financial records while ensuring transparent settlement.

### 3. 🔐 Security & Authentication
- **Secure Sign Up & Log In**: Passwords hashed with `bcryptjs` (salt rounds: 10).
- **JWT in HTTP-Only Cookies**: Tokens issued via secure HTTP-only cookies (`sameSite: 'lax'`) preventing XSS attacks.
- **Ownership & Membership Authorization**: Strict backend middleware ensuring users can only read and mutate their own transactions and groups they belong to.
- **Centralized Error Handling**: Unified 4-argument Express error middleware handling Mongoose validation errors, duplicate keys (`E11000`), and JWT expiration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Axios, Vanilla CSS (Modern Dark Navy Theme) |
| **Backend** | Node.js, Express.js, RESTful API architecture |
| **Database** | MongoDB & Mongoose ODM |
| **Security** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors` |
| **Utilities** | Integer-paise split engine, Greedy settlement algorithm, Multer upload service |

---

## 📁 Project Structure

```
bee-team-project/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Toast, SplitCalculator, etc.)
│   │   ├── context/            # AuthContext & global state
│   │   ├── pages/              # Page components (Dashboard, Transactions, Groups, etc.)
│   │   ├── services/           # Axios API services
│   │   ├── utils/              # Currency (₹) and date formatting helpers
│   │   ├── App.jsx             # React Router and layout
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Global design system & tokens
│   └── package.json
│
├── server/                     # Express Backend
│   ├── config/                 # Database connection (db.js)
│   ├── controllers/            # Route controllers (auth, transactions, groups, dashboard)
│   ├── middleware/             # Auth guard & centralized errorHandler
│   ├── models/                 # Mongoose schemas (User, Transaction, Group, GroupExpense)
│   ├── routes/                 # Express routers (auth, transactions, groups, dashboard)
│   ├── services/               # Multer file upload service
│   ├── utils/                  # SplitEngine & Greedy SettlementEngine
│   ├── .env.example            # Environment variables template
│   ├── server.js               # Application entry point
│   └── package.json
```


---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local MongoDB Community Server or MongoDB Atlas free cloud cluster)

### 2. Installation

Clone or open the project folder in your terminal:

```bash
# 1. Install root, backend, and frontend dependencies in one command:
npm run install:all
```

Or install separately:
```bash
npm install                     # in root
cd server && npm install        # in server
cd ../client && npm install     # in client
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory (you can copy `.env.example`):

```bash
# In server/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/settleup
# Or your MongoDB Atlas connection string:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/settleup?retryWrites=true&w=majority
JWT_SECRET=settleup_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Running the Application

From the root project directory, run:

```bash
npm run dev
```

This starts both:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

You can also start them independently:
```bash
# Start backend only
npm run server

# Start frontend only
npm run client
```

---

## 🧪 Testing the Workflows & APIs

### 1. Web Application Flow
1. Open `http://localhost:5173` in your browser.
2. Click **Sign up** and register an account (e.g. `prachi@example.com`).
3. You will be automatically redirected to the **Dashboard**.
4. Navigate to **Transactions**:
   - Add a few income items (e.g., Salary: ₹50,000).
   - Add expense items (e.g., Rent: ₹12,000, Groceries: ₹3,500).
   - Test the search filter, category filter, and sorting.
   - Edit or delete an entry and observe the dashboard update.
5. Navigate to **Groups**:
   - Create a new group (e.g. "Goa Vacation").
   - Add friend emails (e.g. `rishab@example.com`, `sanchita@example.com`).
   - Click into the group to record a group expense:
     - Select who paid and choose **Equal Split** or **Custom Split**.
     - Verify that all shares sum up to the total in integer paise.
   - Navigate to **Settlement** to see the net balances and optimal repayments calculated by the greedy settlement engine.
6. Navigate to **Profile**:
   - View your MongoDB user ID and update your display name.
   - Log out and verify that protected routes redirect back to `/login`.

### 2. Postman API Testing

Import the endpoints or test with cURL:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new user | No |
| `POST` | `/api/auth/login` | Login and receive JWT cookie | No |
| `POST` | `/api/auth/logout` | Clear JWT cookie | Yes |
| `GET` | `/api/auth/me` | Fetch active user profile | Yes |
| `PUT` | `/api/auth/profile` | Update user display name | Yes |
| `GET` | `/api/dashboard/summary` | Aggregated income/expense/balance | Yes |
| `GET` | `/api/transactions` | List user transactions (supports `?type=&category=&search=&sort=`) | Yes |
| `POST` | `/api/transactions` | Create transaction | Yes |
| `PUT` | `/api/transactions/:id` | Update transaction | Yes |
| `DELETE` | `/api/transactions/:id` | Delete transaction | Yes |
| `GET` | `/api/groups` | List user's groups | Yes |
| `POST` | `/api/groups` | Create group with member emails | Yes |
| `GET` | `/api/groups/:id` | Get group details and members | Yes |
| `DELETE` | `/api/groups/:id` | Delete group (creator only) | Yes |
| `GET` | `/api/groups/:id/expenses` | Get expenses in group | Yes |
| `POST` | `/api/groups/:id/expenses` | Add group expense (equal or custom split) | Yes |
| `PUT` | `/api/groups/:id/expenses/:expId` | Edit group expense | Yes |
| `DELETE` | `/api/groups/:id/expenses/:expId` | Delete group expense | Yes |
| `GET` | `/api/groups/:id/settlement` | Get calculated net balances and repayment plan | Yes |

---

## 📚 Syllabus Mapping

For the complete mapping of Lectures 1–48 to code files and demonstration steps, refer to:
👉 **[docs/SYLLABUS_MAPPING.md](docs/SYLLABUS_MAPPING.md)**

---

## 👥 Authors
Developed for the Full-Stack Web Development Course (Lectures 1–48) by the Bee Team.
