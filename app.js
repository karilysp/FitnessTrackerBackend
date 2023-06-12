require("dotenv").config()
const express = require("express")
const app = express()
const cors = require('cors')
const apiRouter = require('./api');
const client = require("./db/client");

// Setup your Middleware and API Router here

app.use(cors());

app.use('/api', apiRouter);

app.use((error, req, res, next) => {
    res.send({
        error:'Error',
        message: error. message, 
        name: 'name'

    })
})

client.connect();

module.exports = app;
