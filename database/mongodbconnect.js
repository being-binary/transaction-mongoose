import mongoose from 'mongoose';
import session from 'express-session';
import connect_to_mongodb_session from 'connect-mongodb-session';
import dotenv from 'dotenv';


dotenv.config();
const mongodbsession = connect_to_mongodb_session(session);


const store = mongodbsession({
    uri: process.env.EXPRESS_MONGO_DB_URL,
    collection: 'loginSession'
}, (error) => {
    if (error) {
        console.error('Error connecting to MongoDB:', error);
    } else {
        console.log('Connected to MongoDB');
    }
});


const session_middleware = session({
        secret: process.env.EXPRESS_SESSION_KEY,
        resave: process.env.EXPRESS_SESSION_RESAVE === 'false' ? false : true,
        saveUninitialized: process.env.EXPRESS_SESSION_SAVEUNINITIALIZED === 'false' ? false : true,
        store: store,
        cookie: {
            httpOnly: process.env.EXPRESS_SESSION_COOKIE_HTTPONLY === 'false' ? false : true, // Make cookie accessible only to the server, not JavaScript
            secure: process.env.EXPRESS_SESSION_COOKIE_SECURE === 'false' ? false : true,  // Set to true in production when using HTTPS
            maxAge: 1000 * 60 * 60 * 24, // 1 day expiration time for the session cookie
            sameSite: process.env.EXPRESS_SESSION_COOKIE_SAMESITE === 'false' ? false : true // CSRF protection
        }
    })

async function connectToMongoDB() {
    try {
        await mongoose.connect(process.env.EXPRESS_MONGO_DB_URL)
        console.log('mongodb connection successfully')
    } catch (error) {
        console.log(error.message)
    }
}



export { connectToMongoDB, session_middleware }