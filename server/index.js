const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler} = require('./middleware/errorMiddleware');

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
const transactionRoutes = require('./routes/transactionRoutes');
const statementRoutes = require('./routes/statementRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/statements', statementRoutes);
//routes
app.get('/',(req, res)=> {
    res.json({
        message : 'Paysense AI server is running',
      status: "success",
      timestamp: new Date().toISOString()   
     });
});


// Error Middleware = must be last
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});