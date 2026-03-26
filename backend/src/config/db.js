import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            // "mongodb+srv://nirojkarki:15ozqA0tvfsL9KNc@kothabhada.ho6cda3.mongodb.net/?appName=KothaBhada"
            "mongodb://localhost:27017/kothabhada"
        );
        console.log('✓ MONGODB CONNECTED SUCCESSFULLY!');
        console.log(`Connected to: ${connection.connection.host}`);
        return connection;
    } catch (error) {
        console.error('✗ MONGODB CONNECTION FAILED:');
        console.error(`Error: ${error.message}`);
        console.error('Make sure MongoDB is running on localhost:27017');
        // Don't exit immediately - allow server to start
        // This allows the health check endpoint to work for diagnostics
        console.warn('WARNING: Server starting without database connection!');
        return null;
    }
};

export default connectDB;