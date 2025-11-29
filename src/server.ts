import express, { Request, Response } from "express";
import {Pool} from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const app = express();
const port = process.env.PORT || 5000;


// middlewires
app.use(express.json());
// app.use(express.urlencoded()));


// db
const pool = new Pool({
    connectionString: `${process.env.DATABASE_URL}`,
    ssl: { rejectUnauthorized: false },
})

const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(75) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            age INT,
            phone VARCHAR(20),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT NOW()
        )`);
};

initDB();


app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post('/users', (req: Request, res: Response) => {
  res.status(201).json(req.body);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
