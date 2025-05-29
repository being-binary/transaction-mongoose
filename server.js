import express from 'express'
import connectToMongoDB from './database/mongodbconnect.js';

const app = express();
const PORT = 3000;

connectToMongoDB()

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});