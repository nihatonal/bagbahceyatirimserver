// models/FormSubmission.js
import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    replies: [
        {
            text: String,
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

export default mongoose.model('FormSubmission', formSchema);
