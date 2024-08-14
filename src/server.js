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
const uri = 'mongodb+srv://ramakrishna14636:Gum2r1qtcQDfNMNL@disciplineforumdb.c6l6v.mongodb.net/facultyLoginDB?retryWrites=true&w=majority';
// Connect to MongoDB
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('facultyLoginDB');
        const usersCollection = db.collection('facultyLoginCollection');
        const stdCollection = db.collection('studentInfoCollection');
        const coordCollection = db.collection('disciplineCoordinatorCollection');
        const issuesCollection = db.collection('disciplineIssuesCollection');

        // Faculty login route
        app.post('/login', async (req, res) => {
            const { username, password } = req.body;

            const user = await usersCollection.findOne({ username, password });

            if (user) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        });

        // Route to fetch student details
        app.post('/fetchStudent', async (req, res) => {
            const { regNO } = req.body;

            const student = await stdCollection.findOne({ regNO });

            if (student) {
                const coordinator = await coordCollection.findOne({ section: student.section });
                res.json({
                    success: true,
                    student: {
                        name: student.name,
                        section: student.section,
                        coordinator: coordinator ? coordinator.name : 'N/A'
                    }
                });
            } else {
                res.json({ success: false });
            }
        });

        // Route to update discipline issues
        app.post('/updateIssue', async (req, res) => {
            const { regNO, issue } = req.body;

            const result = await issuesCollection.updateOne(
                { regNO },
                { $push: { issues: issue } },
                { upsert: true }
            );

            if (result.modifiedCount > 0 || result.upsertedCount > 0) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}

run().catch(console.dir);
