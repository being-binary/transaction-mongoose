import express from 'express'
import userRouter from './routes/user.routes.js'
import { connectToMongoDB, session_middleware } from './database/mongodbconnect.js';
import homeRouter from './routes/home.routes.js';

const app = express();
const PORT = 3000;

connectToMongoDB()

app.set('view engine', 'ejs');

app.use(session_middleware)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/user', userRouter)
app.use('/api', homeRouter)

app.get('/', (req, res) => {
    res.render('server', { message: 'Hello, Express!' });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});