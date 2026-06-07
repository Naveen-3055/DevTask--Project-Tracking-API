const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/errorHandler');


const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');


const app = express();

// middlewares
app.use(helmet());
app.use(cors({origin: 'http://localhost:3000', credentials: true}));
app.use(express.json());
app.use(cookieParser());


// routes
app.use('/api/v1/auth',authRoutes);
app.use('/api/v1/user',userRoutes);


// healthy check
app.get("/health", (req,res)=> {
    res.status(200).json({message: "OK"});
})

// error handling middleware
app.use(errorHandler);

module.exports = app;