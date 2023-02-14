require('dotenv').config();
const connectDb = require('./db/connect');
const express = require('express')
const app = express()
const tasks = require('./routes/tasks')
const notFound = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handle')
const path = require('path');

//assuming app is express Object.
app.get('/',function(req,res) {
    res.sendFile(path.join(__dirname+'/public/index.html'));
});

// middleware
app.use(express.static('./public'));
app.use(express.json());

// routes
app.use('/api/v1/tasks', tasks)

app.use(notFound);
app.use(errorHandlerMiddleware);

const start = async () => {
    try {

        await connectDb(process.env.MONGO_URI)

        app.listen(process.env.APP_PORT, () => { console.log(`Server start on port ${process.env.APP_PORT}`) })

    } catch (error) {
        console.log(error)
    }
}

start()