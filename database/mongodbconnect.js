import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

async function connectToMongoDB () {
    try {
        await mongoose.connect(process.env.EXPRESS_MONGO_DB_URL)
        console.log('mongodb connection successfull')
    } catch (error) {
        console.log(error.message)
    }
}

export default connectToMongoDB