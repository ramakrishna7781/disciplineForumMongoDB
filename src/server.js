const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb'); // MongoDB client

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

// MongoDB connection URI
const uri = 'mongodb+srv://ramakrishna14636:Gum2r1qtcQDfNMNL@disciplineforumdb.c6l6v.mongodb.net/facultyLoginDB?retryWrites=true&w=majority';

// Connect to MongoDB
const client = new MongoClient(uri);

async function run() {
    try {
        // Connect the client to the server
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('facultyLoginDB');
        const usersCollection = db.collection('facultyLoginCollection');

        // Route to handle login
        app.post('/login', async (req, res) => {
            const { username, password } = req.body;

            try {
                // Query to check if the username and password are correct
                const user = await usersCollection.findOne({ username, password });

                if (user) {
                    // If a match is found, login is successful
                    res.json({ success: true });
                } else {
                    // If no match is found, login fails
                    res.json({ success: false });
                }
            } catch (error) {
                console.error('Error querying the database:', error);
                res.status(500).json({ success: false });
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server running at http://10.128.12.7:${port}/`);
        });
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

run().catch(console.dir);
