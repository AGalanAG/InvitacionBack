const fs = require('fs');
const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

dotenv.config();

// 1. Configuración de logs (Winston)
const { combine, timestamp, json } = winston.format;
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3001;

// 2. Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://maps.gstatic.com"]
    }
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// 3. Configuración CORS para Render y Vercel
const allowedOrigins = [
  'https://*.vercel.app', // Dominios de Vercel
  'https://*.onrender.com', // Dominios de Render
  process.env.NODE_ENV === 'development' && 'http://localhost:3000' //Si estamos en desarrollo permitimos localhost si no, no lo permitimos 
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      logger.warn(`Bloqueado por CORS: ${origin}`);
      callback(new Error('Acceso no permitido'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: 'Límite de solicitudes excedido',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Demasiados registros desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json()); // Para parsear el cuerpo de las solicitudes JSON
app.use((req, res, next) => {
  console.log('Cuerpo de la solicitud:', req.body);
  next();
});


// 5. Configuración de MySQL para Clever Cloud
const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  port: process.env.MYSQL_ADDON_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 25,
  queueLimit: 0
});

// 6. Validaciones
const validateAttendance = [
  body('fullName').notEmpty().trim().escape().isLength({ max: 100 }),
  body('contactMethod').isIn(['whatsapp', 'email']),
  body('contactInfo').custom((value, { req }) => {
    if (req.body.contactMethod === 'email') {
      if (!validator.isEmail(value)) throw new Error('Email inválido');
    } else {
      if (!validator.isMobilePhone(value, 'es-MX')) throw new Error('Teléfono inválido');
    }
    return true;
  }),
  body('guests').isInt({ min: 0, max: 10 })
];



// 7. Endpoints
app.post('/api/attendance', apiLimiter, authLimiter, validateAttendance, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM attendees WHERE contact_info = ? LIMIT 1',
      [req.body.contactInfo]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ya estás registrado' });
    }

    await pool.execute(
      'INSERT INTO attendees (full_name, contact_method, contact_info, guests) VALUES (?, ?, ?, ?)',
      [req.body.fullName, req.body.contactMethod, req.body.contactInfo, req.body.guests]
    );

    // LLamar a los servicios de notificación
    // Determinar si se debe enviar un mensaje de WhatsApp o un correo electrónico
    if (contactMethod === 'email') {
      await sendEmailConfirmation(req.body.contactInfo);
    }else{
      await sendWhatsAppConfirmation(req.body.contactInfo);
    }

    res.status(201).json({ message: 'Registro exitoso' });
  } catch (error) {
    logger.error(`Error en registro: ${error.message}`);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/verify', apiLimiter, async (req, res) => {
  try {
    const [results] = await pool.execute(
      'SELECT * FROM attendees WHERE contact_info = ?',
      [req.query.contactInfo]
    );
    res.json({ registered: results.length > 0 });
  } catch (error) {
    logger.error(`Error en verificación: ${error.message}`);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// 8. Iniciar servidor
app.listen(port, () => {
  logger.info(`Servidor listo en puerto ${port} (Entorno: ${process.env.NODE_ENV || 'development'})`);
});