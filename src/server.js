const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

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
const uri = 'mongodb+srv://ramakrishna14636:Gum2r1qtcQDfNMNL@disciplineforumdb.c6l6v.mongodb.net/facultyLoginDB?retryWrites=true&w=majority'; // Replace this with your actual MongoDB URI

// Connect to MongoDB
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('facultyLoginDB');
        const usersCollection = db.collection('facultyLoginCollection');

        // Route to handle login
        app.post('/login', async (req, res) => {
            const { username, password } = req.body;

            try {
                const user = await usersCollection.findOne({ username, password });

                if (user) {
                    res.json({ success: true });
                } else {
                    res.json({ success: false });
                }
            } catch (error) {
                console.error('Error querying the database:', error);
                res.status(500).json({ success: false });
            }
        });

        // Route to handle fetching student details
        app.post('/fetchStudent', async (req, res) => {
            const { regNO } = req.body;

            try {
                const student = await usersCollection.findOne({ regNO });

                if (student) {
                    res.json({ success: true, student });
                } else {
                    res.json({ success: false });
                }
            } catch (error) {
                console.error('Error fetching student details:', error);
                res.status(500).json({ success: false });
            }
        });

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
        });
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

run().catch(console.dir);
