import express, { NextFunction, Request, Response } from "express";
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
            description TEXT,
            completed BOOLEAN DEFAULT FALSE,
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log(`done`);
};

initDB();


// middleware
const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}\n`);
    next();
}


// routes
app.get("/", logger,(req: Request, res: Response) => {
  res.send("Hello World!");
});

// users
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

app.put('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, age, phone, address } = req.body;
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2, age = $3, phone = $4, address = $5 WHERE id = $6 RETURNING *',
            [name, email, age, phone, address, id]
        );
        
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            res.status(200).json({ success: true, message: 'User updated successfully', data: result.rows[0] });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

app.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            res.status(404).json({ success: false, message: 'User not found' });
        } else {
            res.status(200).json({ success: true, message: 'User deleted successfully', data: result.rows[0] });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message });
    }
})


// todos
app.post('/todos', async (req: Request, res: Response) => {
    try {
        const { user_id, title, description, completed, due_date } = req.body;
        const result = await pool.query(
            'INSERT INTO todos (user_id, title, description, completed, due_date) VALUES ($1, $2, $3, $4 , $5) RETURNING *',
            [user_id, title, description, completed, due_date]
        );
        res.status(201).json({ success: true, message: 'Todo created successfully', data: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message });
    }
});

app.get('/todos', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM todos');
        res.status(200).json({ success: true, message: 'Todos fetched successfully', data: result.rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error?.message });
    }
});



// 404 route
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Route not found', path: req.url });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
