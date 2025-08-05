// scripts/createAdmin.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';

dotenv.config(); // .env dosyasından DB bağlantısı ve JWT_SECRET alır

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const username = "nihat"
  const password = "nihat"
  const email = "onalnihat1986@gmail.com"

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = new Admin({
    username: username,
    email: email,
    password: hashedPassword,
  });

  await admin.save();
  console.log("Admin oluşturuldu:", admin);
  process.exit();
}

createAdmin();

//node scripts/createAdmin.js