require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'tareas_db';

const db = mysql.createConnection({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    port: parseInt(process.env.MYSQLPORT) || 3306,
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a MySQL.');

    db.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) { console.error('Error creando DB:', err); process.exit(1); }
        
        db.query(`USE ${dbName}`, (err) => {
            if (err) { console.error('Error usando DB:', err); process.exit(1); }
            runMigrations();
        });
    });
});

async function runMigrations() {
    console.log('Ejecutando migraciones...');

    const schema = [
        `CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS usuarios (
            id VARCHAR(50) PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            avatar VARCHAR(255)
        )`,
        `CREATE TABLE IF NOT EXISTS tareas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            resumen TEXT,
            expira VARCHAR(255),
            idUsuario VARCHAR(50) NOT NULL,
            completada BOOLEAN DEFAULT 0,
            CONSTRAINT fk_usuario_setup FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
        )`
    ];

    for (let sql of schema) {
        await db.promise().query(sql);
    }

    // Seed default admin
    const [admins] = await db.promise().query('SELECT COUNT(*) as count FROM admins');
    if (admins[0].count === 0) {
        const hash = await bcrypt.hash('admin123', 10);
        await db.promise().query('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hash]);
        console.log('👤 Admin por defecto creado: admin / admin123');
    }

    // Seed default users
    const [users] = await db.promise().query('SELECT COUNT(*) as count FROM usuarios');
    if (users[0].count === 0) {
        const values = [
            ['u1', 'Will Smith', 'https://img2.rtve.es/im/6467488/?w=900'],
            ['u2', 'Martin Lawrence', 'https://cdn.britannica.com/01/219501-050-42074723/Martin-Lawrence-2020.jpg'],
            ['u3', 'Mr Stiven', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrdpQUXS_VTskvCbjSoRLfNgRqMjYvU2j5GA&s']
        ];
        await db.promise().query('INSERT INTO usuarios (id, nombre, avatar) VALUES ?', [values]);
        console.log('👥 Usuarios iniciales creados.');
    }

    console.log('🚀 Inicialización de base de datos COMPLETA.');
    process.exit(0);
}
