const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crisis_detector';
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        console.log('Attempting In-Memory MongoDB Fallback...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            console.log('MongoDB Connected via In-Memory Fallback at', memoryUri);
        } catch (memError) {
            console.error('In-Memory MongoDB failed too:', memError.message);
        }
    }
};

module.exports = connectDB;
