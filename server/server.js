require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/database');

const app = express();

connectDB();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
// CORS – tylko dla Twojego frontendu
const allowedOrigins = [
  'http://localhost:3000',
  
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serwer: http://localhost:${PORT}`);
});

// Rate limiting – ochrona przed spamem i brute-force
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 5, // max 5 zamówień na IP
  message: { error: 'Too many orders, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});



// === WALIDACJA DANYCH ===
const orderValidation = [
  body('furnitureType')
    .trim()
    .isIn(['chair', 'table', 'cabinet', 'bed', 'shelf'])
    .withMessage('Invalid furniture type'),
  
  body('woodType')
    .trim()
    .isIn(['oak', 'pine', 'walnut', 'cherry', 'maple'])
    .withMessage('Invalid wood type'),
  
  body('dimensions')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dimensions must be 1-100 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes too long (max 500 chars)'),
];

// === AUTH MIDDLEWARE (ulepszone) ===
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    
    if (!payload.userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// === TRANSPORT NODemailer – BEZPIECZNIEJSZY ===
const createTransporter = () => {
  // W produkcji: użyj SendGrid, Mailgun, Amazon SES
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Dev: użyj Ethereal (testowe maile)
  return nodemailer.createTestAccount().then(testAccount => {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  });
};

// === ENDPOINT: /orders ===
app.post('/orders', auth, orderValidation, async (req, res) => {
  // Sprawdź błędy walidacji
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { furnitureType, woodType, dimensions, notes } = req.body;

  try {
    const user = await User.findById(req.userId).select('email'); // tylko email
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Zabezpiecz dane przed injection w mailu
    const safeEmail = user.email.replace(/[^\w.@+-]/g, '');
    const safeFurniture = furnitureType.replace(/[^\w\s]/g, '');
    const safeWood = woodType.replace(/[^\w\s]/g, '');

    const order = new Order({
      userEmail: safeEmail,
      furnitureType: safeFurniture,
      woodType: safeWood,
      dimensions: dimensions.slice(0, 100),
      notes: notes?.slice(0, 500) || '',
      createdAt: new Date(),
    });

    await order.save();

    // Wysyłka maila
    let transporter;
    try {
      transporter = await createTransporter();
    } catch (err) {
      console.error('Failed to create transporter:', err);
      return res.status(500).json({ error: 'Email service unavailable' });
    }

    const mailOptions = {
      from: `"Furniture Shop" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: safeEmail,
      subject: `Potwierdzenie zamówienia #${order._id}`,
      text: `
Witaj!

Twoje zamówienie zostało przyjęte:
- Mebel: ${safeFurniture}
- Drewno: ${safeWood}
- Wymiary: ${dimensions}
${notes ? `- Uwagi: ${notes}` : ''}

Dziękujemy za zaufanie!
      `.trim(),
      // HTML wersja (opcjonalnie)
      // html: `<p>Witaj! ...</p>`
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    } catch (mailErr) {
      console.error('Failed to send email:', mailErr);
      // Nie przerywaj – zamówienie zapisane, mail nie wysłany
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId: order._id,
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Server error' });
  }

});
