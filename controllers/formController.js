import FormSubmission from '../models/FormSubmission.js';
import sendEmail from '../utils/sendEmail.js';

export const handleForm = async (req, res) => {
    const { name, email, message, phone } = req.body;

    if (!name || !email || !message || !phone) {
        return res.status(400).json({ error: 'Tüm alanlar gerekli.' });
    }

    try {
        const submission = await FormSubmission.create({ name, phone, email, message });

        await sendEmail({
            to: process.env.CONTACT_RECEIVER,
            subject: 'Yeni İletişim Formu Mesajı',
            html: `
                <h3>Yeni Mesaj</h3>
                <p><strong>İsim:</strong> ${name}</p>
                <p><strong>Tel:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mesaj:</strong><br/>${message}</p>
            `
        });

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Form gönderim hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Yeni: Tüm form mesajlarını listele
export const getAllForms = async (req, res) => {
    try {
        const submissions = await FormSubmission.find().sort({ createdAt: -1 }); // en yeni önce
        res.status(200).json(submissions);
    } catch (err) {
        console.error('Form listeleme hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};
