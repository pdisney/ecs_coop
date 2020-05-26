'use strict';

const httpserver = require('http');
const httpsserver = require('https');
const express = require('express'); // Express node module
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const MongoWrapper = require('./libs/mongodb/MongoWrapper');
const logingInit = require('./libs/winston/loginit');



const initGlobalVariables = () => {
    global = {};
    global.collections = {};
    global.collections.apps = 'apps';
    global.collections.users = 'users';
    global.collections.questions = 'questions';
    global.collections.sources = 'sources';
    global.collections.loginDetails = "loginDetails";
    global.collections.analytics = 'analytics';
    global.collections.notifications_ttl = 'notifications_ttl';
    global.collections.feedback = 'feedback';
    global.collections.coc_history = 'coc_history';

};

const testInit = () => {
    const processenv = {

        NODE_ENV: "staging",


        MONGO_BARNUM_USER: "barnumUser",
        MONGO_BARNUM_PASSWORD: "nutepuNuw5St",
        MONGO_ADMIN: "barnumAdmin",
        MONGO_PASSWORD: "barnum456",
        MONGO_CONNECTION: "54.40.187.27:27017/barnum?replicaSet=barnumSet",
        MONGO_PORT: 27017,
        MONGO_DATABASE: 'barnum',

        SECURE_API: false,
        PORT: 8080,
        SSLPORT: 443,
        SSLENABLED: false,
        CERTKEY: "",
        CERT: "",
        PASSPHRASE: "",

        SMTP_ADDRESS: "smtp://mailhost.ecs:25"
    };

    process.env.MONGO_CONNECTION = processenv.MONGO_CONNECTION;
    process.env.MONGO_DATABASE = processenv.MONGO_DATABASE;
    process.env.PORT = processenv.PORT;
    process.env.SSLENABLED = processenv.SSLENABLED;
    process.env.SECURE_API = processenv.SECURE_API;

}

var main = async () => {
    try {
        testInit();
        initGlobalVariables();

        // await logingInit.loggingInit();
        console.log(process.env.MONGO_CONNECTION);
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
