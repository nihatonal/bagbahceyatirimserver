import Newsletter from '../models/Newsletter.js';
import sendEmail from '../utils/sendEmail.js';  // sendEmail yardımcı fonksiyonun

export const subscribeNewsletter = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email gerekli' });

    try {
        const existing = await Newsletter.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Bu email zaten kayıtlı' });

        await Newsletter.create({ email });

        // Yeni abone için mail gönderimi
        await sendEmail({
            to: process.env.CONTACT_RECEIVER,
            subject: 'Yeni Newsletter Abonesi',
            html: `
                <h3>Yeni Abone Kaydı</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p>Siteye yeni bir newsletter abonesi eklendi.</p>
            `
        });

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Newsletter kayıt hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

// Yeni: Tüm newsletter kayıtlarını listele
export const getAllNewsletters = async (req, res) => {
    try {
        const emails = await Newsletter.find().sort({ createdAt: -1 });
        res.status(200).json(emails);
    } catch (err) {
        console.error('Newsletter listeleme hatası:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};
