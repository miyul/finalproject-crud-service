const express = require('express');
const mongoose = require('mongoose');
const Member = require('./model');
const auth = require('./auth')();
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const WEBHOOK_URL = 'https://webhook.site/dfca2134-8940-42fc-8142-4c70e439cdc2';

// MongoDB via ENV (cloud ready)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('CRUD DB connected'))
  .catch(err => console.error('DB error:', err.message));

// Middleware
app.use(express.json());
app.use(auth.initialize());

// 🔐 HEADER VALIDATION (IMPROVED)
function validateHeaders(req, res, next) {
  if (
    !req.headers['accept']?.includes('application/json') ||
    !req.headers['content-type']?.includes('application/json')
  ) {
    return res.status(406).json({
      message: 'Only application/json is supported'
    });
  }
  next();
}

// ---------------- SYSTEM TO SYSTEM ----------------
async function notifyExternalSystem(data) {
  try {
    await axios.post(WEBHOOK_URL, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('System-to-system notification sent');
  } catch (err) {
    console.error('System-to-system call failed:', err.message);
  }
}

// ---------------- CREATE ----------------
app.post('/api/members', validateHeaders, auth.authenticate(), async (req, res) => {
  try {
    const member = await Member.create(req.body);

    notifyExternalSystem({
      event: 'MEMBER_CREATED',
      data: member
    });

    res.status(201).json({
      message: 'Member created and external system notified',
      member
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
    const updated = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
