require('dotenv').config(); // Tambahkan ini di bagian atas

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Database sederhana untuk menyimpan OTP (sesi sementara)
let users = {
    "rickoalexa0098@gmail.com": {
        password: "12345",
        otp: null,
        otpExpiration: null
    }
};

// Konfigurasi transporter email menggunakan variabel dari file .env
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Bisa diganti sesuai provider email Anda
    auth: {
        user: process.env.EMAIL_USER,  // Mengambil email dari .env
        pass: process.env.EMAIL_PASS   // Mengambil password dari .env
    }
});

// Halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

// Verifikasi login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (users[email] && users[email].password === password) {
        // Buat OTP acak
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiration = Date.now() + 5 * 60 * 1000; // 5 menit
        users[email].otp = otp;
        users[email].otpExpiration = expiration;

        // Kirim OTP via email
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Kode OTP Anda',
            text: `Kode OTP Anda adalah: ${otp}`
        }, (error, info) => {
            if (error) {
                return res.send('Gagal mengirim email.');
            }
            res.sendFile(__dirname + '/otp.html');
        });
    } else {
        res.send('Email atau password salah!');
    }
});

// Verifikasi OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (users[email] && users[email].otp === otp && Date.now() < users[email].otpExpiration) {
        users[email].otp = null;  // Reset OTP setelah berhasil login
        res.send('Login berhasil!');
    } else {
        res.send('OTP salah atau sudah kadaluarsa!');
    }
});

app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});
