const express = require('express');
const cors = require('cors');
const client = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Endpoints para Personas
app.post('/api/personas', async (req, res) => {
  const { nombre, apellido1, apellido2, dni } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO Persona (nombre, apellido1, apellido2, dni) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, apellido1, apellido2, dni]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/personas', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM Persona');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/personas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('SELECT * FROM Persona WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/personas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido1, apellido2, dni } = req.body;

  try {
    const result = await client.query(
      'UPDATE Persona SET nombre = $1, apellido1 = $2, apellido2 = $3, dni = $4 WHERE id = $5 RETURNING *',
      [nombre, apellido1, apellido2, dni, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/personas/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Primero eliminamos los coches relacionados
    await client.query('DELETE FROM Coche WHERE persona_id = $1', [id]);

    // Luego eliminamos la persona
    const result = await client.query('DELETE FROM Persona WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.status(200).json({ message: 'Persona eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints para Coches
app.post('/api/coches', async (req, res) => {
  const { matricula, marca, modelo, caballos, persona_id } = req.body;
  try {
    const result = await client.query(
      'INSERT INTO Coche (matricula, marca, modelo, caballos, persona_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [matricula, marca, modelo, caballos, persona_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/coches', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM Coche');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/coches/:matricula', async (req, res) => {
  const { matricula } = req.params;
  try {
    const result = await client.query('SELECT * FROM Coche WHERE matricula = $1', [matricula]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coche no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/coches/:matricula', async (req, res) => {
  const { matricula } = req.params;
  const { marca, modelo, caballos, persona_id } = req.body;
  try {
    const result = await client.query(
      'UPDATE coche SET marca = $1, modelo = $2, caballos = $3, persona_id = $4 WHERE matricula = $5 RETURNING *',
      [marca, modelo, caballos, persona_id, matricula]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coche no encontrado' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coches/:matricula', async (req, res) => {
  const { matricula } = req.params;
  try {
    const result = await client.query('DELETE FROM coche WHERE matricula = $1 RETURNING *', [matricula]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coche no encontrado' });
    }
    res.status(200).json({ mensaje: 'Coche eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener los coches de una persona
app.get('/api/personas/:id/coches', async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar si la persona existe
    const persona = await client.query('SELECT * FROM Persona WHERE id = $1', [id]);
    if (persona.rows.length === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    
    const result = await client.query(
      'SELECT * FROM Coche WHERE persona_id = $1',
      [id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener la persona dueña de un coche
app.get('/api/coches/:matricula/persona', async (req, res) => {
  const { matricula } = req.params;
  try {
    // Verificar si el coche existe
    const coche = await client.query('SELECT * FROM Coche WHERE matricula = $1', [matricula]);
    if (coche.rows.length === 0) {
      return res.status(404).json({ error: 'Coche no encontrado' });
    }
    
    const result = await client.query(
      'SELECT p.* FROM Persona p JOIN Coche c ON p.id = c.persona_id WHERE c.matricula = $1',
      [matricula]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});