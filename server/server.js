// CORS (allow your frontend)
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Auth middleware
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected order endpoint (uses authenticated user's email)
app.post('/orders', auth, async (req, res) => {
  const { furnitureType, woodType, dimensions, notes } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const order = new Order({
      userEmail: user.email,
      furnitureType,
      woodType,
      dimensions,
      notes,
    });
    await order.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Order Confirmation',
      text: `Your order for ${furnitureType} from ${woodType} wood has been received.`,
    });

    res.status(201).json({ message: 'Order created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
