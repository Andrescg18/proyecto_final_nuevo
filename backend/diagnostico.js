require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection(process.env.MYSQL_URL || {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    port: parseInt(process.env.MYSQLPORT) || 3306,
    database: process.env.MYSQLDATABASE || 'tareas_db'
});

db.connect((err) => {
    if (err) { console.error('Error:', err.message); process.exit(1); }
    
    db.query('SHOW TABLES', (err, results) => {
        if (err) { console.error(err); process.exit(1); }
        console.log('Tablas encontradas:', results);
        
        db.query('DESCRIBE usuarios', (err, res) => {
            if (err) console.log('Tabla "usuarios" NO existe.');
            else console.log('Estructura "usuarios":', res);
            process.exit(0);
        });
    });
});
