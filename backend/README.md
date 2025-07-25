# AWARA1 Backend (Node.js)

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```

Server will run on [http://localhost:3001](http://localhost:3001)

## API Endpoints

- `POST /api/signup`  — Register a new user
- `POST /api/login`   — Login with user credentials

> Note: This backend currently uses in-memory storage. For production, connect a real database (MongoDB, MySQL, etc). 