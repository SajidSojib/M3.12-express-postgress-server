import express, { Request, Response } from "express";

const app = express();
const port = 5000;

app.use(express.json());
// app.use(express.urlencoded()));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post('/users', (req: Request, res: Response) => {
  res.status(201).json(req.body);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
