const express = require('express');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use('/api', userRoutes);
    
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
