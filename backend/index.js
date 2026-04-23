require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
console.log('🚀 Backend iniciando - v2.0 con MySQL Railway');


const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

// Configuración de CORS permisiva para facilitar el despliegue
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// Servir archivos estáticos desde la carpeta public (RF-05)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de salud para Railway Healthcheck
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', mensaje: 'Backend funcionando correctamente' });
});

const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'tareas_db';
let db;

const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    port: parseInt(process.env.MYSQLPORT) || process.env.DB_PORT || 3306,
    database: dbName,
    ssl: process.env.DB_SSL === 'true' ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    } : null
};

connectToDB();

function connectToDB() {
    console.log('[DB] Conectando a:', dbConfig.host);
    db = mysql.createConnection(process.env.MYSQL_URL || dbConfig);

    db.connect((err) => {
        if (err) {
            console.error('❌ Error conectando a MySQL/TiDB:', err.message);
            console.error('❌ Código de error:', err.code);
            // Si falla por SSL, intentamos sin validación estricta como fallback de último recurso
            // pero solo si estamos en desarrollo.
            if (err.code === 'HANDSHAKE_SSL_ERROR' && process.env.NODE_ENV !== 'production') {
                 console.log('[DB] ⚠️ Reintentando con rejectUnauthorized: false...');
                 dbConfig.ssl.rejectUnauthorized = false;
                 connectToDB();
                 return;
            }
            return;
        }
        console.log('✅ Conectado a la base de datos correctamente.');
        initializeTables();
    });
}

async function initializeTables() {
    console.log('[DB] Iniciando Migraciones de Esquema...');

    try {
        // 1. Crear tabla de ADMINS
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);
        await autoSeedAdmin();

        // 2. Crear tabla de USUARIOS (PERSONAS) - REQUERIMIENTO RF-02
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id VARCHAR(50) PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                avatar VARCHAR(255)
            )
        `);
        await autoSeedUsuarios();

        // 3. Crear tabla de TAREAS con Integridad Referencial - REQUERIMIENTO RF-03
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS tareas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                resumen TEXT,
                expira VARCHAR(255),
                idUsuario VARCHAR(50) NOT NULL,
                completada BOOLEAN DEFAULT 0
            )
        `);

        // 4. PARCHE DE MIGRACIÓN: Asegurar que tareas tenga la Foreign Key (RF-06)
        // Intentamos añadir el constraint por si la tabla ya existía sin él
        try {
            // Primero aseguramos que el tipo de columna sea correcto (VARCHAR 50)
            await db.promise().query('ALTER TABLE tareas MODIFY idUsuario VARCHAR(50) NOT NULL');
            
            // Intentamos añadir la Foreign Key con ON DELETE CASCADE
            // Nota: usamos un bloque try/catch interno por si ya existe el constraint
            await db.promise().query(`
                ALTER TABLE tareas 
                ADD CONSTRAINT fk_usuario_personas 
                FOREIGN KEY (idUsuario) REFERENCES usuarios(id) 
                ON DELETE CASCADE
            `);
            console.log('[DB] ✅ Integridad Referencial (Cascade Delete) activada.');
        } catch (fkError) {
            // Si el error es que ya existe, lo ignoramos
            if (fkError.code !== 'ER_DUP_CONSTRAINT_NAME' && fkError.code !== 'ER_FK_DUP_NAME') {
                console.log('[DB] Nota: La relación de integridad ya estaba presente o el motor no soporta la operación directa.');
            }
        }

        console.log('[DB] 🚀 Todas las tablas sincronizadas correctamente.');
    } catch (err) {
        console.error('❌ ERROR CRÍTICO EN MIGRACIONES:', err);
    }
}

async function autoSeedAdmin() {
    try {
        const [results] = await db.promise().query('SELECT COUNT(*) as count FROM admins');
        
        if (results[0].count === 0) {
            console.log('No hay administradores, creando usuario por defecto "admin"');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.promise().query('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
            console.log('Admin por defecto creado exitosamente.');
        }
    } catch (err) {
        console.error('Error verificando/creando admins:', err);
    }
}

async function autoSeedUsuarios() {
    try {
        const [results] = await db.promise().query('SELECT COUNT(*) as count FROM usuarios');
        
        if (results[0].count === 0) {
            console.log('Migrando usuarios iniciales...');
            const values = [
                ['u1', 'Will Smith', 'https://img2.rtve.es/im/6467488/?w=900'],
                ['u2', 'Martin Lawrence', 'https://cdn.britannica.com/01/219501-050-42074723/Martin-Lawrence-2020.jpg'],
                ['u3', 'Mr Stiven', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrdpQUXS_VTskvCbjSoRLfNgRqMjYvU2j5GA&s']
            ];
            await db.promise().query('INSERT INTO usuarios (id, nombre, avatar) VALUES ?', [values]);
            console.log('Usuarios iniciales migrados exitosamente.');
        }
    } catch (err) {
        console.error('Error verificando/migrando usuarios:', err);
    }
}

// Middleware de Autenticación JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
        req.user = user;
        next();
    });
}

// ========================
// AUTH ROUTES
// ========================

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[LOGIN] Intento de login para usuario: "${username}"`);
    
    if (!username || !password) {
        return res.status(400).json({ mensaje: 'Usuario y contraseña son requeridos' });
    }

    try {
        const [rows] = await db.promise().execute('SELECT * FROM admins WHERE username = ?', [username]);
        
        if (rows.length === 0) {
            console.log(`[LOGIN] Usuario no encontrado: "${username}"`);
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log(`[LOGIN] Contraseña incorrecta para: "${username}"`);
            return res.status(401).json({ mensaje: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        console.log(`[LOGIN] ✅ Login exitoso para: "${username}"`);
        res.json({ token, username: user.username, id: user.id });
    } catch (error) {
        console.error('[LOGIN] ❌ ERROR CRÍTICO:', error);
        res.status(500).json({ 
            mensaje: 'Error interno del servidor al iniciar sesión', 
            detalle: error.message
        });
    }
});


app.post('/api/auth/admins', authenticateToken, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ mensaje: 'Usuario y contraseña requeridos' });
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO admins (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensaje: 'El usuario ya existe' });
                return res.status(500).json(err);
            }
            res.json({ mensaje: 'Administrador creado!', id: result.insertId });
        });
    } catch(e) {
        res.status(500).json({ mensaje: 'Error al procesar contraseña' });
    }
});

app.put('/api/auth/admins', authenticateToken, async (req, res) => {
    const { username, password } = req.body;
    const userId = req.user.id;
    
    if (!username && !password) {
        return res.status(400).json({ mensaje: 'No hay datos para actualizar' });
    }
    
    try {
        let sql = 'UPDATE admins SET ';
        const params = [];
        
        if (username) {
            sql += 'username = ?';
            params.push(username);
        }
        
        if (password) {
            if (username) sql += ', ';
            const hashedPassword = await bcrypt.hash(password, 10);
            sql += 'password = ?';
            params.push(hashedPassword);
        }
        
        sql += ' WHERE id = ?';
        params.push(userId);
        
        db.query(sql, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensaje: 'El usuario ya existe' });
                return res.status(500).json(err);
            }
            res.json({ mensaje: 'Perfil actualizado correctamente' });
        });
    } catch (e) {
        res.status(500).json({ mensaje: 'Error al procesar actualización' });
    }
});

app.get('/api/auth/admins', authenticateToken, (req, res) => {
    db.query('SELECT id, username FROM admins', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.delete('/api/auth/admins/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id;
    
    // Seguridad: No permitir auto-eliminación
    if (parseInt(id) === currentUserId) {
        return res.status(400).json({ mensaje: 'No puedes eliminarte a ti mismo.' });
    }

    // Verificar si es el último admin
    db.query('SELECT COUNT(*) as count FROM admins', (err, results) => {
        if (err) return res.status(500).json(err);
        
        if (results[0].count <= 1) {
            return res.status(400).json({ mensaje: 'No puedes eliminar al último administrador del sistema.' });
        }

        db.query('DELETE FROM admins WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Administrador eliminado exitosamente.' });
        });
    });
});

app.put('/api/auth/admins/:id/password', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ mensaje: 'La nueva contraseña es requerida' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, id], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
        });
    } catch (e) {
        res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
    }
});

// ========================
// USUARIOS (PERSONAS) ROUTES
// ========================

const AVATAR_CATALOG_FALLBACK = [
    'https://img2.rtve.es/im/6467488/?w=900', // Will Smith
    'https://cdn.britannica.com/01/219501-050-42074723/Martin-Lawrence-2020.jpg', // Martin
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrdpQUXS_VTskvCbjSoRLfNgRqMjYvU2j5GA&s', // Mr Stiven
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka'
];

app.get('/api/usuarios/catalogo', (req, res) => {
    const avatarsDir = path.join(__dirname, 'public', 'avatares');
    
    // Obtener el protocolo y el host para construir URLs completas
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}/avatares/`;

    try {
        if (!fs.existsSync(avatarsDir)) {
            return res.json(AVATAR_CATALOG_FALLBACK);
        }

        const files = fs.readdirSync(avatarsDir);
        const localAvatars = files
            .filter(file => /\.(png|jpg|jpeg|svg|webp)$/i.test(file))
            .map(file => baseUrl + encodeURIComponent(file));

        // Si no hay archivos locales, enviamos el catálogo de respaldo
        if (localAvatars.length === 0) {
            return res.json(AVATAR_CATALOG_FALLBACK);
        }

        res.json(localAvatars);
    } catch (err) {
        console.error('Error leyendo catálogo de avatares:', err);
        res.json(AVATAR_CATALOG_FALLBACK);
    }
});

app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/usuarios', authenticateToken, async (req, res) => {
    try {
        const { nombre, avatar } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es requerido' });
        
        const id = 'u' + Date.now();
        const defaultAvatar = AVATAR_CATALOG_FALLBACK[3]; // Felix as default

        await db.promise().query(
            'INSERT INTO usuarios (id, nombre, avatar) VALUES (?, ?, ?)', 
            [id, nombre, avatar || defaultAvatar]
        );

        res.json({ id, nombre, avatar: avatar || defaultAvatar, mensaje: 'Usuario creado exitosamente.' });
    } catch (err) {
        console.error('[USUARIOS] Error al crear usuario:', err);
        res.status(500).json({ mensaje: 'Error interno al intentar crear el usuario.', detalle: err.message });
    }
});

app.put('/api/usuarios/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { nombre, avatar } = req.body;
    
    if (!nombre && !avatar) return res.status(400).json({ mensaje: 'No hay datos para actualizar' });

    let sql = 'UPDATE usuarios SET ';
    const params = [];
    if (nombre) { sql += 'nombre = ?'; params.push(nombre); }
    if (avatar) { 
        if (nombre) sql += ', ';
        sql += 'avatar = ?'; 
        params.push(avatar); 
    }
    sql += ' WHERE id = ?';
    params.push(id);

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Perfil de usuario actualizado exitosamente.' });
    });
});

app.delete('/api/usuarios/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    // Al eliminar el usuario, las tareas se eliminan automáticamente por ON DELETE CASCADE
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.json({ mensaje: 'Usuario y sus tareas eliminados correctamente.' });
    });
});

// ========================
// TAREAS ROUTES
// ========================

app.get('/api/tareas/:idUsuario', (req, res) => {
    const idUsuario = req.params.idUsuario?.trim();
    console.log('[API] Buscando tareas para usuario:', idUsuario);
    const sql = 'SELECT * FROM tareas WHERE idUsuario = ? ORDER BY id DESC';
    db.query(sql, [idUsuario], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/tareas', authenticateToken, (req, res) => {
    const { titulo, resumen, fecha, idUsuario } = req.body; 
    const sql = 'INSERT INTO tareas (titulo, resumen, expira, idUsuario, completada) VALUES (?, ?, ?, ?, 0)';
    db.query(sql, [titulo, resumen, fecha || null, idUsuario], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, mensaje: 'Guardado!' });
    });
});

app.put('/api/tareas/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { titulo, resumen, expira, completada } = req.body;
    const sql = 'UPDATE tareas SET titulo = COALESCE(?, titulo), resumen = COALESCE(?, resumen), expira = COALESCE(?, expira), completada = COALESCE(?, completada) WHERE id = ?';
    db.query(sql, [titulo, resumen, expira, completada !== undefined ? (completada ? 1 : 0) : null, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Tarea actualizada!' });
    });
});

app.delete('/api/tareas/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tareas WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Tarea eliminada!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`💡 Nota: También disponible en todas las interfaces de red (0.0.0.0)`);
});