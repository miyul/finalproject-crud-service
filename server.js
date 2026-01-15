const nodemailer = require('nodemailer');
const express = require('express');
const mongoose = require('mongoose');
const Member = require('./model');
const auth = require('./auth')();

const app = express();
const PORT = process.env.PORT || 3002;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'muhdamirulakmal16@gmail.com',
    pass: 'mvswygvkvlwgvvtz'
  }
});

// MongoDB Cloud
mongoose.connect(process.env.MONGO_URI)

// Middleware
app.use(express.json());
app.use(auth.initialize());

// 🔐 HEADER VALIDATION
function validateHeaders(req, res, next) {
  if (
    req.headers['accept'] !== 'application/json' ||
    req.headers['content-type'] !== 'application/json'
  ) {
    return res.status(406).json({
      message: 'Only application/json is supported'
    });
  }
  next();
}

// ---------------- SEND MAIL FUNCTION ----------------
async function sendWelcomeEmail(name, email) {
  try {
    await transporter.sendMail({
      from: '"Final Project System" <YOUR_GMAIL@gmail.com>',
      to: email,
      subject: 'Welcome to Our System',
      text: `Hi ${name},\n\nYour account has been successfully created.\n\nThank you!`
    });

    console.log('Welcome email sent to ' + email);
  } catch (err) {
    console.error('Email sending failed:', err.message);
  }
}

// ---------------- CREATE ----------------
app.post('/api/members', validateHeaders, auth.authenticate(), async (req, res) => {
  try {
    const member = await Member.create(req.body);

    // 🔔 SYSTEM-TO-SYSTEM COMMUNICATION
    await sendWelcomeEmail(member.name, member.email);

    res.status(201).json({
      message: 'Member created and email sent',
      member: member
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------- READ ----------------
app.get('/api/members', validateHeaders, auth.authenticate(), async (req, res) => {
  try {
    const members = await Member.find();
    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- UPDATE ----------------
app.put('/api/members/:id', validateHeaders, auth.authenticate(), async (req, res) => {
  try {
    const updated = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: 'Record not found' });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------------- DELETE ----------------
app.delete('/api/members/:id', validateHeaders, auth.authenticate(), async (req, res) => {
  try {
    const deleted = await Member.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: 'Record not found' });

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () =>
  console.log('CRUD microservice running on port ' + PORT)
);