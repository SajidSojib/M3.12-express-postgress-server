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

        await pool.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(150) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                due_date DATE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);
};

initDB();


// routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post('/users', async (req: Request, res: Response) => {
    try {
        const { name, email, age, phone, address } = req.body;

        const result = await pool.query(
            'INSERT INTO users (name, email, age, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, email, age, phone, address]            
        );
        res.status(201).json({ success: true, message: 'User created successfully', data: result.rows[0] });
    } catch (error: any) {
        // console.error(error);
        res.status(500).json({ success: false, message: error?.message });
    }
});

app.get('/users', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.status(200).json({ success: true, message: 'Users fetched successfully', data: result.rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

app.get('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            res.status(200).json({ success: true, message: 'User fetched successfully', data: result.rows[0] });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message });
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
