const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, printf } = format;
const { SPLAT, LEVEL } = require('triple-beam');
const util = require('util');
 

const stringConstructor = "test".constructor;
const arrayConstructor = [].constructor;
const objectConstructor = ({}).constructor;
 
const getType = (object) => {
    if (object === null) {
        return "null";
    }
    if (object === undefined) {
        return "undefined";
    }
    if (object.constructor === stringConstructor) {
        return "String";
    }
    if (object.constructor === arrayConstructor) {
        return "Array";
    }
    if (object.constructor === objectConstructor) {
        return "Object";
    }
    {
        return "don't know";
    }
}




/**
* @param {*} dir
 */
let dirExists = (dir) => {
    return new Promise((resolve) => {
        fs.exists(dir, (exists) => {
            return resolve(exists);
        })
    })
}
/**
*
 * @param {*} dir
 */
let mkDir = (dir) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, (err) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            return resolve();
        });
    })
}
 
const formatObject = (param) => {
    if (typeof param === 'string') {
        return param;
    }
    if (param instanceof Error) {
        if (getType(param) === "Object") {
            return param.stack ? param.stack : JSON.stringify(param, null, 2);
        }
        else {
            return param.stack ? param.stack : util.inspect(param, { showHidden: true, depth: 100 });
        }
    }
    if (getType(param) === "Object") {
        return JSON.stringify(param, null, 2);
    }
    else {
        return util.inspect(param, { showHidden: true, depth: 100 });
    }
 

};
 
const all = format((info) => {
    const splat = info[SPLAT] || [];
    const message = formatObject(info.message);
    const rest = splat.map(formatObject).join(' ');
    info.message = `${message} ${rest}`;
    return info;
});
 
const myFormat = printf(info => {
    if (info instanceof Error) {
        return ` ${info.timestamp} ${info.level} : ${info.message} ; ${info.stack} `;
    }
    return ` ${info.timestamp} ${info.level} : ${info.message} `;
});
 
let loggingInit = async () => {
 
    if (!global.config) {
        global.config = {};
    }
 
    global.config.log_level = process.env.LOG_LEVEL || "debug";
    global.config.log_file_directory = process.env.LOG_FILE_DIRECTORY || path.join(__dirname, "/../../log");;
 
    let direxists = await dirExists(global.config.log_file_directory);
    console.log(direxists)
    if (!direxists) {
        await mkDir(global.config.log_file_directory)
    }
 
    var options = {
        file: {
            name: "process-log",
            filename: path.join(global.config.log_file_directory, '/process.log'),
            json: false,
            level: global.config.log_level,
            maxsize: 5242880, //5MB
            maxFiles: 1000,
            handleExceptions: false,
            format: combine(
                format.colorize({
                    all: true
                }))
        },
        exceptions_file: {
            name: "exception-log",
            filename: path.join(global.config.log_file_directory, '/exception.log'),
            json: false,
            handleExceptions: true,
            level: "error",
            maxsize: 5242880, //5MB
            maxFiles: 1000
        },
        json_file: {
            level: global.config.log_level,
            filename: path.join(global.config.log_file_directory, '/process.json'),
            handleExceptions: true,
            json: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: combine(
                format.colorize({
                    all: true
                }))
        },
        console: {
            level: global.config.log_level,
            handleExceptions: true,
            json: false,
            format: combine(
                format.colorize({
                    all: true
                }))
        },
    };
 
    let logger = createLogger({
        format: combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            all(),
            myFormat
        ),
        transports: [
            new transports.File(options.exceptions_file),
            new transports.File(options.file),
            new transports.File(options.json_file),
            new transports.Console(options.console)]
    });
 

    logger.extend = function (target) {
        var self = this;
        ['log', 'profile', 'startTimer']
            .concat(Object.keys(logger.levels))
            .forEach(function (method) {
                console[method] = function () {
                    return logger[method].apply(logger, arguments);
                };
            });
    }
 
    logger.extend(console);
 
    console.log = function () {
        return logger.info.apply(logger, arguments);
    };
 

    console.info("Logging Initialized");
 
    return;
};
 

module.exports.loggingInit = loggingInit;
 