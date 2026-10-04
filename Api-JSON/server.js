require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 1. GET /api/v1/estudiantes
app.get('/api/v1/estudiantes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estudiante ORDER BY id_estudiante DESC');
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error interno del servidor', detail: error.message });
    }
});

// 2. GET /api/v1/estudiantes/:id
app.get('/api/v1/estudiantes/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM estudiante WHERE id_estudiante = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Estudiante no encontrado' });
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

// 3. POST /api/v1/estudiantes
app.post('/api/v1/estudiantes', async (req, res) => {
    const { nombre_completo, correo_electronico, fecha_nacimiento, estatus } = req.body;
    
    if (!nombre_completo || !correo_electronico || !fecha_nacimiento) {
        return res.status(400).json({ status: 'error', message: 'Faltan datos obligatorios' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO estudiante (nombre_completo, correo_electronico, fecha_nacimiento, estatus) VALUES (?, ?, ?, ?)',
            [nombre_completo, correo_electronico, fecha_nacimiento, estatus || 'Activo']
        );
        res.status(201).json({ status: 'success', message: 'Registro creado exitosamente', id: result.insertId });
    } catch (error) {
        if(error.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'El correo electrónico ya existe' });
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

// 4. PUT /api/v1/estudiantes/:id
app.put('/api/v1/estudiantes/:id', async (req, res) => {
    const { nombre_completo, correo_electronico, fecha_nacimiento, estatus } = req.body;
    
    if (!nombre_completo || !correo_electronico || !fecha_nacimiento) {
        return res.status(400).json({ status: 'error', message: 'Faltan datos obligatorios' });
    }
    try {
        const [check] = await pool.query('SELECT * FROM estudiante WHERE id_estudiante = ?', [req.params.id]);
        if (check.length === 0) return res.status(404).json({ status: 'error', message: 'Estudiante no encontrado' });

        await pool.query(
            'UPDATE estudiante SET nombre_completo = ?, correo_electronico = ?, fecha_nacimiento = ?, estatus = ? WHERE id_estudiante = ?',
            [nombre_completo, correo_electronico, fecha_nacimiento, estatus || 'Activo', req.params.id]
        );
        res.status(200).json({ status: 'success', message: 'Registro actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

// 5. DELETE /api/v1/estudiantes/:id
app.delete('/api/v1/estudiantes/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM estudiante WHERE id_estudiante = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Estudiante no encontrado' });
        res.status(200).json({ status: 'success', message: 'Registro eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

app.listen(port, () => {
    console.log(`API RESTful iniciada correctamente en el puerto ${port}`);
});
