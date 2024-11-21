const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');

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
        const stdCollection = db.collection('studentInfoCollection');
        const coordCollection = db.collection('disciplineIssuesCollection');
        const mailsCollection = db.collection('mailsCollection'); // Collection for coordinator emails

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
                const student = await stdCollection.findOne({ regNO });

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

        // Route to handle updating the issue
        app.post('/updateIssue', async (req, res) => {
            const { regNO, issue } = req.body;

            try {
                const student = await stdCollection.findOne({ regNO });

                if (student) {
                    const { name, section } = student;

                    // Create the student issue object
                    const studentIssue = {
                        regNO,
                        name,
                        section,
                        issue,
                        dateReported: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), // IST date and time,
                    };

                    // Update the coordinator's document
                    await coordCollection.updateOne(
                        { section },
                        { $push: { studentIssues: studentIssue } }
                    );

                    // Update the HOD's document
                    await coordCollection.updateOne(
                        { name: 'HOD' },
                        { $push: { studentIssues: studentIssue } }
                    );

                    res.json({ success: true });
                } else {
                    res.status(404).json({ success: false, message: 'Student not found' });
                }
            } catch (error) {
                console.error('Error updating issue:', error);
                res.status(500).json({ success: false });
            }
        });

        // Route to handle sending emails
        app.post('/sendEmails', async (req, res) => {
            try {
                const coordinators = await coordCollection.find({ 'studentIssues.0': { $exists: true } }).toArray();

                if (coordinators.length === 0) {
                    return res.json({ success: false, message: 'No issues to send.' });
                }

                const mailList = await mailsCollection.find().toArray();
                const emailMap = mailList.reduce((map, item) => {
                    map[item.section] = item.email;
                    return map;
                }, {});

                // Create a transporter object using SMTP transport
                const transporter = nodemailer.createTransport({
                    service: 'gmail', // Replace with your email service
                    auth: {
                        user: 'ramakrishnark1716@gmail.com', // Replace with your email
                        pass: 'dnjv ymaw xtss uhrc', // Replace with your email password
                    },
                });

                for (const coord of coordinators) {
                    const { name, section, studentIssues } = coord;

                    // Determine email content
                    let subject, text;
                    if (name === 'HOD') {
                        subject = 'Student Issues';
                        text = `Dear ${name},\n\nThe following issues have been reported today:\n\n${studentIssues.map(issue => `Register Number: ${issue.regNO}\nName: ${issue.name}\nSection: ${issue.section}\nIssue: ${issue.issue}\nDate Reported: ${issue.dateReported}`).join('\n\n')}\n\nBest regards,\nDiscipline Forum`;
                    } else {
                        subject = `Student Issues for ${section}`;
                        text = `Dear ${name},\n\nThe following issues have been reported for your section:\n\n${studentIssues.map(issue => `Register Number: ${issue.regNO}\nName: ${issue.name}\nIssue: ${issue.issue}\nDate Reported: ${issue.dateReported}`).join('\n\n')}\n\nBest regards,\nDiscipline Forum`;
                    }

                    // Determine recipient email
                    const email = emailMap[section];
                    if (!email) {
                        console.error(`No email found for section ${section}`);
                        continue;
                    }

                    // Send email
                    await transporter.sendMail({
                        from: 'ramakrishnark1716@gmail.com',
                        to: email,
                        subject,
                        text,
                    });

                    // Clear the issues after sending the email
                    await coordCollection.updateOne(
                        { name },
                        { $set: { studentIssues: [] } }
                    );
                }

                res.json({ success: true });
            } catch (error) {
                console.error('Error sending emails:', error);
                res.status(500).json({ success: false });
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

run().catch(console.dir);
