const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

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

//routes
app.use('/',(req, res)=> {
    res.json({
        message : 'Paysense AI server is running',
    status: "success",
timestamp: new Date().toISOString()    });
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