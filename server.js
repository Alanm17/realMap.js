const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

// Create an Express application
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // your username
  password: 'your_password', // your MySQL password
  database: 'workout_db', // your database name
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Create a new workout (POST)
app.post('/workouts', (req, res) => {
  const { type, distance, duration, cadence, elevationGain, lat, lng } =
    req.body;

  // Input validation
  if (!type || !distance || !duration || !lat || !lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `INSERT INTO workouts (type, distance, duration, cadence, elevation_gain, lat, lng)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    query,
    [type, distance, duration, cadence, elevationGain, lat, lng],
    (err, results) => {
      if (err) {
        console.error('Error inserting workout:', err);
        return res.status(500).json({ error: 'Failed to add workout' });
      }
      res.status(201).json({ message: 'Workout added', id: results.insertId });
    }
  );
});

// Get all workouts (GET)
app.get('/workouts', (req, res) => {
  const query = 'SELECT * FROM workouts';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching workouts:', err);
      return res.status(500).json({ error: 'Failed to fetch workouts' });
    }
    res.status(200).json(results);
  });
});

// Update a workout (PUT)
app.put('/workouts/:id', (req, res) => {
  const id = req.params.id;
  const { type, distance, duration, cadence, elevationGain, lat, lng } =
    req.body;

  // Input validation
  if (!type || !distance || !duration || !lat || !lng) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `UPDATE workouts SET type = ?, distance = ?, duration = ?, cadence = ?, elevation_gain = ?, lat = ?, lng = ?
                   WHERE id = ?`;

  db.query(
    query,
    [type, distance, duration, cadence, elevationGain, lat, lng, id],
    (err, results) => {
      if (err) {
        console.error('Error updating workout:', err);
        return res.status(500).json({ error: 'Failed to update workout' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Workout not found' });
      }
      res.status(200).json({ message: 'Workout updated' });
    }
  );
});

// Delete a workout (DELETE)
app.delete('/workouts/:id', (req, res) => {
  const id = req.params.id;

  const query = `DELETE FROM workouts WHERE id = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error deleting workout:', err);
      return res.status(500).json({ error: 'Failed to delete workout' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.status(200).json({ message: 'Workout deleted' });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
