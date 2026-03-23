const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

//load environment variables
dotenv.config();

//connect mongodb
connectDB();

const app = express();

//middlewares
app.use(cors({
    origin : process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const statementRoutes = require('./routes/statementRoutes');
app.use('/api/statments', statementRoutes);



//routes
app.get('/',(req, res)=> {
    res.json({
        message : 'Paysense AI server is running',
      status: "success",
      timestamp: new Date().toISOString()   
     });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

//error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});