import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // your env variable
    console.log(
      `Connected to MongoDB Database: ${conn.connection.host}`.bgMagenta.white
    );
  } catch (error) {
    console.error(`Error in MongoDB: ${error.message}`.bgRed.white);
    process.exit(1); // stop server if DB fails
  }
};

export default connectDB;
