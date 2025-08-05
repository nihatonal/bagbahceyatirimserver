// controllers/adminController.js
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import Newsletter from '../models/Newsletter.js';
import FormSubmission from '../models/FormSubmission.js'
import SubscriberMessage from '../models/SubscriberMessage.js'
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });

    try {
        const admin = await Admin.findOne({ username: username.toLowerCase() });

        if (!admin)
            return res.status(401).json({ error: 'Geçersiz kullanıcı adı' });
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
            return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre2' });

        const token = generateToken(admin._id);
        res.status(200).json({
            _id: admin._id,
            username: admin.username,
            email: admin.email,
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

export const getProfile = (req, res) => {
    if (!req.admin) return res.status(404).json({ error: 'Admin bulunamadı' });
    res.status(200).json(req.admin); // Zaten select('-password') ile geldi
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
        return res.status(400).json({ error: 'Tüm alanlar zorunludur' });

    try {
        const admin = await Admin.findById(req.admin._id);
        if (!admin) return res.status(404).json({ error: 'Admin bulunamadı' });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch)
            return res.status(401).json({ error: 'Mevcut şifre hatalı' });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        res.status(200).json({ message: 'Şifre başarıyla güncellendi' });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

const resetTokens = new Map(); // { email: { code, expiresAt } }

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email gerekli' });

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Email bulunamadı' });

        const code = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 dk geçerli

        resetTokens.set(email, { code, expiresAt });
        await sendEmail({
            to: email,
            subject: 'Şifre Sıfırlama Kodu',
            html: `Kodunuz: ${code}`
        });

        res.json({ message: 'Şifre sıfırlama kodu gönderildi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
    console.log(resetTokens);
};
export const verifyResetCode = (req, res) => {
    const { email, code } = req.body;
    const tokenData = resetTokens.get(email);

    if (!tokenData) return res.status(400).json({ error: 'Kod bulunamadı veya süresi doldu' });

    const { code: validCode, expiresAt } = tokenData;

    if (Date.now() > expiresAt)
        return res.status(400).json({ error: 'Kodun süresi dolmuş' });

    if (code !== validCode)
        return res.status(400).json({ error: 'Kod geçersiz' });

    res.json({ message: 'Kod doğrulandı' });
};

export const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    const tokenData = resetTokens.get(email);
    if (!tokenData) return res.status(400).json({ error: 'Kod bulunamadı veya süresi doldu' });

    if (tokenData.code !== code || Date.now() > tokenData.expiresAt) {
        return res.status(400).json({ error: 'Geçersiz veya süresi geçmiş kod' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ error: 'Admin bulunamadı' });

        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();
        resetTokens.delete(email);

        res.json({ message: 'Şifre başarıyla sıfırlandı' });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

export const sendNewsletterToAll = async (req, res) => {
    const { subject, html } = req.body;
    if (!subject || !html) return res.status(400).json({ error: 'Subject ve içerik gerekli' });

    try {
        const allSubscribers = await Newsletter.find({}, 'email');
        const emails = allSubscribers.map(sub => sub.email);

        // Basit toplu gönderim (dikkat spam olmasın, gerçek projede queue/batch kullan)
        for (const email of emails) {
            await sendEmail({ to: email, subject: subject, html: html });
        }

        // 🧾 MongoDB'ye kayıt:
        await SubscriberMessage.create({
            subject,
            html,
            sentToCount: emails.length,
        });

        res.json({ message: `${emails.length} email gönderildi.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

export const replyMessage = async (req, res) => {
    const { text } = req.body;

    try {
        const message = await FormSubmission.findById(req.params.id);
        if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı' });

        message.replies.push({ text });
        await message.save();
        // E-posta gönder
        await sendEmail({
            to: message.email,
            subject: 'Mesajınıza Yanıt Geldi',
            html: `
                <p>Merhaba <strong>${message.name}</strong>,</p>
                <p>Bağlantı kurduğunuz için teşekkür ederiz. Mesajınıza aşağıdaki yanıtı verdik:</p>
                <blockquote style="margin: 1em 0; padding: 1em; background-color: #f9f9f9; border-left: 4px solid #ccc;">
                ${text}
                </blockquote>
                <p>İyi günler dileriz.</p>

                <hr style="margin: 2em 0; border: none; border-top: 1px solid #ddd;" />

                <div style="font-size: 0.9rem; color: #555;">
                <strong>Bağ Bahçe Yatırım</strong><br />
                📧 <a href="mailto:info@bagbahceyatirim.com" style="color: #555;">info@bagbahceyatirim.com</a><br />
                📞 <a href="tel:+905551112233" style="color: #555;">+90 555 111 22 33</a><br />
              🌐 <a href="https://bagbahceyatirim.com" target="_blank" style="color: #555;">www.bagbahceyatirim.com</a><br /><br />
    
             🔗 Bizi Takip Edin:<br />
                <a href="https://www.instagram.com/bagbahce_yatirim/" target="_blank" style="color: #555; text-decoration: none;">Instagram</a> |
                <a href="https://www.facebook.com/share/19phEu29m5/" target="_blank" style="color: #555; text-decoration: none;">Facebook</a> |
                <a href="https://wa.me/905079870088" target="_blank" style="color: #555; text-decoration: none;">WhatsApp</a>
                </div>
`

        });

        res.status(200).json(message);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
};

export const getSubscriberMessages = async (req, res) => {
    try {
        const messages = await SubscriberMessage.find().sort({ sentAt: -1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası" });
    }
};

export const deleteSubscriber = async (req, res) => {
    try {
        const subscriber = await Newsletter.findByIdAndDelete(req.params.id);
        if (!subscriber) return res.status(404).json({ error: "Abone bulunamadı" });
        res.status(200).json({ message: "Abone silindi" });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası" });
    }
};

