'use strict';

const httpserver = require('http');
const httpsserver = require('https');
const express = require('express'); // Express node module
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const MongoWrapper = require('./libs/mongodb/MongoWrapper');
const logingInit = require('./libs/winston/loginit');
const { monitorEventLoopDelay } = require('perf_hooks');



const initGlobalVariables = () => {
    global.collections = {};
    global.collections.students = 'students';


};

const testInit = () => {
    const processenv = {

        NODE_ENV: "staging",

        SECURE_API: false,
        PORT: 8080,
        SSLPORT: 443,
        SSLENABLED: false,
        CERTKEY: "",
        CERT: "",
        PASSPHRASE: "",

    };

    process.env.MONGO_CONNECTION = processenv.MONGO_CONNECTION;
    process.env.MONGO_DATABASE = processenv.MONGO_DATABASE;
    process.env.PORT = processenv.PORT;
    process.env.SSLENABLED = processenv.SSLENABLED;
    process.env.SECURE_API = processenv.SECURE_API;

}

var main = async () => {
    try {
        await logingInit.loggingInit();
        testInit();
        initGlobalVariables();

        const mongo = new MongoWrapper("localhost", "ECS");
        await mongo.establishConnection();
        // await logingInit.loggingInit();
        // const mongo = new MongoWrapper(mongo_connection, database);
        //  await mongo.establishConnection();
        //* ****************************//
        // Express App - Section
        //* ****************************//
        const app = express();

        //* ****************************//
        // Express-Compression - Section
        //* ****************************//

        //* ****************************//
        // Express-Static - Section
        //* ****************************//
        app.use(express.static(path.join(__dirname, '/build')));
        //  app.use(express.static(path.join(__dirname, '/public')));

        app.use(bodyParser.json({
            limit: '50mb',
        }));
        app.use(bodyParser.urlencoded({
            limit: '50mb',
            extended: true,
            parameterLimit: 50000,
        }));

        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });


        //* ****************************//
        // Express-Session - Section
        //* ****************************//


        //* ****************************//
        // Passport Config - Section
        //* ****************************//


        // REGISTER OUR API endpoints -------------------------------
        /**
         * Http->Https redirect middleware
         */
        if (process.env.SSLENABLED === 'true') {
            app.use((req, res, next) => {
                if (!req.secure) {
                    const newUrl = "https://" + req.hostname + ":" + process.env.SSLPORT + req.url;
                    res.redirect(307, newUrl);
                } else {
                    next();
                }
            });
        }

        //* ****************************//
        // Web Server Routes - Section
        //* ****************************//
        app.get('/', (req, res, next) => {
            res.sendFile(path.join(__dirname, 'build', 'index.js'))

        });

        app.get('/api/students', async (req, res, next) => {
            try {
                const results = await mongo.find(global.collections.students, {});
                console.debug(results);
                res.status(200).json(results);
            } catch (err) {
                console.error(err);
                res.status(500).send(err);
            }

        });

        app.post('/api/student', async (req, res, next) => {
            try {
                const student = req.body;
                console.debug("Input", req.body);
                const results = await mongo.insert(global.collections.students, student);
                res.status(200).json(results);
            } catch (err) {
                console.error(err);
                res.status(500).send(err);
            }

        });

        app.put('/api/student/:student_id', async (req, res, next) => {
            try {
                let update = req.body;
                console.debug(update);
                let query = { _id: mongo.getObjectId(req.params.student_id) };
                const results = await mongo.update(global.collections.students, query, {$set: update});
                console.debug(results);
                res.status(200).json(results);
            } catch (err) {
                console.error(err);
                res.status(500).send(err);
            }

        });

        app.delete('/api/student/:student_id', async (req, res, next) => {
            try {
                let query = { _id: mongo.getObjectId(req.params.student_id) };
                const results = await mongo.delete(global.collections.students,query);
                console.debug(results);
                res.status(200).json(results);
            } catch (err) {
                console.error(err);
                res.status(500).send(err);
            }

        });

        /** **************        ***************** */
        /** ************** ROUTES ***************** */
        /** **************        ***************** */



        httpserver.Server(app).listen(process.env.PORT);
        console.info("ECS COOP Listening on", process.env.PORT);

        /**
         * Start HTTPS server
         */
        if (process.env.SSLENABLED === 'true') {
            httpsserver.createServer({
                key: fs.readFileSync(process.env.CERTKEY),
                cert: fs.readFileSync(process.env.CERT),
                passphrase: process.env.PASSPHRASE,
            }, app).listen(process.env.SSLPORT);
            console.info("ECS COOP Listening on", process.env.SSLPORT);
        }


    } catch (err) {
        console.error(err);
    }

};

main();
