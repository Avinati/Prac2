const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const mysql2 = require('mysql2');
const { pool } = require('./bd.js'); 
const PORT = 3006;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

function checkConnection() {
    pool.getConnection((err, connection) => {
        if (err) {
            console.log('Ошибка подключения к базе данных:', err);
        } else {
            console.log('Успешное подключение к базе данных');
            connection.release();
        }
    });
}

checkConnection();

app.get('/', (req, res) => {
    res.json({
        message: 'Это базовый маршрут, сервер работает'
    })
})

app.post('/reg', async (req, res) => {
    try {
        const { name, surename, nick, email, password, phone, personalData, privacyPolicy } = req.body;

        if (!name || !surename || !nick || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Все поля обязательны для заполнения'
            });
        }

        if (!personalData || !privacyPolicy) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо согласиться с обработкой персональных данных и политикой конфиденциальности'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Пароль должен содержать минимум 6 символов'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const sql = 'INSERT INTO users (name, surename, nick, email, password, phone) VALUES (?, ?, ?, ?, ?, ?)';
        
        pool.query(sql, [name, surname, nick, email, hashedPassword, phone], (err, result) => {
            if (err) {
                console.log("Ошибка ввода данных", err);

                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        success: false,
                        message: 'Пользователь с таким email или ником уже существует'
                    });
                }
                
                return res.status(500).json({
                    success: false,
                    message: 'Ошибка регистрации'
                });
            } else {
                return res.json({
                    success: true,
                    message: 'Успешная регистрация'
                });
            }
        });
    } catch (error) {
        console.log("Ошибка сервера", error);
        return res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

app.listen(PORT, () => {
    console.log('Сервер запущен на порту ' + PORT);
});