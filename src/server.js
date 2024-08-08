const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql'); // or any other database client library

const app = express();
const port = 8000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'facultyLogin.html'));
});

// Database connection
const db = mysql.createConnection({
    host: 'localhost', // replace with your database host
    user: 'root', // replace with your database username
    password: 'mySQLdb@0308!', // replace with your database password
    database: 'discipline_forum' // replace with your database name
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

// Route to handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Query to check if the username and password are correct
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (error, results) => {
        if (error) {
            console.error('Error querying the database:', error);
            return res.status(500).json({ success: false });
        }

        if (results.length > 0) {
            // If a match is found, login is successful
            res.json({ success: true });
        } else {
            // If no match is found, login fails
            res.json({ success: false });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://10.128.12.230:${port}/`);
});
