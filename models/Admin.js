import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetCode: { type: String },  // Şifre sıfırlama kodu
    resetCodeExpires: { type: Date }
});


export default mongoose.model('Admin', adminSchema);
