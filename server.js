const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'workout_db',
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    process.exit(1);
  }
  console.log('Connected to MySQL', db.threadId);
});

app.post('/workouts', (req, res) => {
  const {
    user_id,
    workout_name,
    distance,
    duration,
    coords,
    cadence,
    elevation,
    workout_date,
  } = req.body;

  if (
    !user_id ||
    !workout_name ||
    !distance ||
    !duration ||
    !coords ||
    !workout_date
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (
    !Array.isArray(coords) ||
    coords.length !== 2 ||
    !coords.every(Number.isFinite)
  ) {
    return res.status(400).json({
      error:
        'Invalid coordinates format. Expected an array of two numbers [lat, lng].',
    });
  }

  if (workout_name === 'running') {
    if (!cadence) {
      return res
        .status(400)
        .json({ error: 'Cadence is required for running workouts' });
    }
    const query = `INSERT INTO workouts (user_id, workout_name, distance, duration, coords, cadence, workout_date) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      query,
      [
        user_id,
        workout_name,
        distance,
        duration,
        JSON.stringify(coords),
        cadence,
        workout_date,
      ],
      (err, results) => {
        if (err) {
          console.error('Error inserting workout:', err);
          return res.status(500).json({ error: 'Failed to add workout' });
        }

        const workoutId = results.insertId;
        res.status(201).json({
          message: 'Workout added',
          workout: {
            id: workoutId,
            user_id,
            workout_name,
            distance,
            duration,
            coords,
            cadence,
            workout_date,
          },
        });
      }
    );
  }

  // Cycling workout
  if (workout_name === 'cycling') {
    if (!elevation) {
      return res
        .status(400)
        .json({ error: 'Elevation is required for cycling workouts' });
    }
    const query = `INSERT INTO workouts (user_id, workout_name, distance, duration, coords, elevation, workout_date) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      query,
      [
        user_id,
        workout_name,
        distance,
        duration,
        JSON.stringify(coords),
        elevation,
        workout_date,
      ],
      (err, results) => {
        if (err) {
          console.error('Error inserting workout:', err);
          return res.status(500).json({ error: 'Failed to add workout' });
        }

        const workoutId = results.insertId;
        res.status(201).json({
          message: 'Workout added',
          workout: {
            id: workoutId,
            user_id,
            workout_name,
            distance,
            duration,
            coords,
            elevation,
            workout_date,
          },
        });
      }
    );
  }

  return res.status(400).json({ error: 'Invalid workout name' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
