<!-- 
This README file provides an overview of implementing a secure WebSocket API using the AsyncAPI specification. 
It includes details on how to define, document, and secure WebSocket-based APIs effectively. 
Refer to this file for setup instructions, examples, and best practices for using AsyncAPI with WebSocket protocols.
-->
# 🔐 Secure WebSocket API Using AsyncApi

This is a **secure, production-ready WebSocket-based API** built using **Node.js**, **MySQL**, and **AsyncAPI** specification. It supports **user registration, login with token generation**, and **authenticated CRUD operations**, protected using **API tokens with expiry**.

---

## 📦 Technology Stack

| Layer              | Tech Used                         |
|--------------------|-----------------------------------|
| Backend Server     | Node.js (`ws`, `https`, `dotenv`) |
| Database           | MySQL 8+                          |
| Authentication     | API Tokens + bcrypt Password Hashing |
| Logging            | File-based logging system         |
| SSL/TLS            | Self-signed or CA-issued certs (`WSS`) |
| API Documentation  | [AsyncAPI](https://www.asyncapi.com/) |
| ORM/SQL Handling   | MySQL2 with stored procedures     |

---

## ⚙️ Features

- 🔐 Secure WebSocket (`wss://`) server
- 🧑 User Registration and Login
- 🪪 Token-based authentication with expiration
- ✏️ CRUD Operations on Users
- 📜 Structured AsyncAPI spec
- 📊 Logging for security/audit trails

---

## 🔑 Authentication Flow

1. `auth/register` - Register a new user.
2. `auth/generateToken` - Authenticate with email/password to get a token.
3. Use the `token` for all other `user/*` operations.

Tokens are valid for **7 days** and are stored along with **client IP & user-agent info**.

---

## 📡 WebSocket API Payloads

### 1. 📝 Register User

**Channel:** `auth/register`  
**Token Required:** ❌

```json
{
  "channel": "auth/register",
  "payload": {
    "name": "Alice",
    "email": "alice@example.com",
    "password": "SecretPass123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "userId": 1
}
```

---

### 2. 🔑 Generate API Token

**Channel:** `auth/generateToken`  
**Token Required:** ❌

```json
{
  "channel": "auth/generateToken",
  "payload": {
    "email": "alice@example.com",
    "password": "SecretPass123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "token": "abc1234xyz...",
  "expires_at": "2025-05-22T10:00:00.000Z"
}
```

---

### 3. ➕ Create User

**Channel:** `user/create`  
**Token Required:** ✅

```json
{
  "channel": "user/create",
  "apiToken": "abc1234xyz...",
  "payload": {
    "name": "Bob",
    "email": "bob@example.com"
  }
}
```

**Response:**

```json
{
  "success": true,
  "userId": 2
}
```

---

### 4. 🔍 Read User

**Channel:** `user/read`  
**Token Required:** ✅

```json
{
  "channel": "user/read",
  "apiToken": "abc1234xyz...",
  "payload": {
    "id": 2
  }
}
```

**Response:**

```json
{
  "id": 2,
  "name": "Bob",
  "email": "bob@example.com",
  "created_at": "2025-05-15T12:30:00Z"
}
```

---

### 5. ✏️ Update User

**Channel:** `user/update`  
**Token Required:** ✅

```json
{
  "channel": "user/update",
  "apiToken": "abc1234xyz...",
  "payload": {
    "id": 2,
    "name": "Bobby",
    "email": "bobby@example.com"
  }
}
```

**Response:**

```json
{
  "success": true
}
```

---

### 6. ❌ Delete User

**Channel:** `user/delete`  
**Token Required:** ✅

```json
{
  "channel": "user/delete",
  "apiToken": "abc1234xyz...",
  "payload": {
    "id": 2
  }
}
```

**Response:**

```json
{
  "success": true
}
```

---

## 🧰 Setup & Run Locally

### Prerequisites:
- Node.js 18+
- MySQL 8+
- OpenSSL (for self-signed certs if needed)

### 1. Clone Repo

```bash
git clone https://github.com/bfl-ajay/AsyncApi-Example.git
cd AsyncApi-Example
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create SSL Certs (for development)

```bash
mkdir cert
openssl req -newkey rsa:2048 -nodes -keyout cert/server.key -x509 -days 365 -out cert/server.crt
```

### 4. Setup MySQL

Run `schema.sql`:

```bash
mysql -u root -p < schema.sql
```

### 5. Add `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=userdb
PORT=3000
```

### 6. Start Server

```bash
node server.js
```

---

## 📜 AsyncAPI Documentation

You can generate HTML documentation from `asyncapi.yaml`:

```bash
npm install -g @asyncapi/cli
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template -o asyncapi-docs
npx serve asyncapi-docs
```

Then visit: `http://localhost:3000`

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt**
- Tokens expire in **7 days**
- Client IP and User-Agent are stored for audit
- SSL (WSS) is used to encrypt communication

---

# Updates

## 🛠️ Environment Variables & Configuration

The application now **validates required environment variables** before starting. If any are missing, the server will not start and will display an error message. This ensures reliability and prevents misconfiguration.

### Required `.env` Variables

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=userdb
API_PORT=3000
```

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`: MySQL connection settings.
- `API_PORT`: The port your WebSocket API will listen on (used for both local and Docker Compose).

> **Note:** The server will throw an error if any of these variables are missing.

---

## 🐳 Docker & Docker Compose

- The `Dockerfile` and `docker-compose.yml` now use `API_PORT` for exposing the API server port.
- The database service uses `DB_PORT` for MySQL.
- All environment variables are loaded from `.env` for both services.

### Example: Running with Docker Compose

```bash
docker-compose up --build
```

---

## ⚙️ Running Locally

1. **Copy `.env.example` to `.env` and fill in your values.**
2. **Start the server:**
   ```bash
   node server.js
   ```
   If any required environment variable is missing, the server will exit with an error.

---

## 🔒 Security & Reliability

- **Environment variable validation** prevents accidental misconfiguration.
- **Consistent variable names** (`API_PORT` instead of `PORT`) across code, Docker, and documentation.

---

**Be sure to update your `.env` file and use `API_PORT` for the server port.**  
If you previously used `PORT`, rename it to `API_PORT` in your `.env`.

## 👨‍💻 Maintainers

- [Ajay Singh](https://github.com/ajay-singh33_bflghec)
- Bajaj Finserv

---

## 📄 License

MIT License © 2025
