import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(
            // "mongodb+srv://nirojkarki:15ozqA0tvfsL9KNc@kothabhada.ho6cda3.mongodb.net/?appName=KothaBhada"
            "mongodb://localhost:27017/kothabhada"
        );
            console.log('MONGODB CONNECTED SUCCESSFULLY!'); 
        } catch (error) {
            console.error('MONGODB connection failed:', error.message);
            process.exit(1);
    }
};

export default connectDB;