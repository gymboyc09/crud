const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://gymboyc:19i1AQKLoMSt0R1W@cluster0.xtfjz9l.mongodb.net/student_results', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Models
const Student = mongoose.model('Student', {
    studentNo: String,
    studentName: String,
    english: Number,
    hindi: Number
});

const Admin = mongoose.model('Admin', {
    username: String,
    password: String
});

// Create default admin if not exists
async function createDefaultAdmin() {
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Admin({
            username: 'admin',
            password: hashedPassword
        });
        await admin.save();
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    if (!req.session.admin) {
        res.redirect('/admin-login.html');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (admin && await bcrypt.compare(password, admin.password)) {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/students', async (req, res) => {
    if (!req.session.admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { studentNo, studentName, english, hindi } = req.body;
    const student = new Student({ studentNo, studentName, english, hindi });
    await student.save();
    res.json({ success: true });
});

app.get('/api/students/:studentNo', async (req, res) => {
    const student = await Student.findOne({ studentNo: req.params.studentNo });
    if (student) {
        res.json(student);
    } else {
        res.status(404).json({ message: 'Student not found' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    createDefaultAdmin();
}); 