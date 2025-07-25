const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
const mongoURI = 'mongodb+srv://kanadegaurav81:uLOvhJvsaQTnuH6B@cluster0.mbkjgn7.mongodb.net/My_Data1?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema & Model
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Booking Schema & Model
const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  slotNumber: { type: Number, required: true },
  timeSlot: { type: String, required: true },
  bookingID: { type: String, required: true, unique: true },
  bookingTime: { type: Date, required: true }
});
const Booking = mongoose.model('Booking', bookingSchema);

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  const { id, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ id }, { email }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = new User({ id, email, password, role });
    await user.save();
    res.json({ success: true, message: 'User registered' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { id, email, password, role } = req.body;
  try {
    const user = await User.findOne({ id, email, password, role });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({ success: true, message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Booking endpoint
app.post('/api/book', async (req, res) => {
  const { name, email, vehicleNumber, slotNumber, timeSlot, bookingID, bookingTime } = req.body;
  try {
    // Check if slot is already booked for the same time slot
    const existing = await Booking.findOne({ slotNumber, timeSlot });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slot is already booked for this time slot.' });
    }
    const booking = new Booking({ name, email, vehicleNumber, slotNumber, timeSlot, bookingID, bookingTime });
    await booking.save();
    res.json({ success: true, message: 'Booking successful', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Bookings endpoint (all bookings, or filter by email if query param provided)
app.get('/api/bookings', async (req, res) => {
  const { email } = req.query;
  try {
    let bookings;
    if (email) {
      bookings = await Booking.find({ email });
    } else {
      bookings = await Booking.find();
    }
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
}); 