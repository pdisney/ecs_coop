
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const { combine, printf } = format;
const { SPLAT } = require('triple-beam');

/**
 * @param {*} dir
 */
const dirExists = dir => new Promise((resolve) => {
    fs.exists(dir, exists => resolve(exists));
});
/**
 *
 * @param {*} dir
 */
const mkDir = dir => new Promise((resolve, reject) => {
    fs.mkdir(dir, (err) => {
        if (err) {
            console.error(err);
            return reject(err);
        }
        return resolve();
    });
});

const formatObject = (param) => {
    if (typeof param === 'string') {
        return param;
    }
    if (param instanceof Error) {
        return param.stack ? param.stack : JSON.stringify(param, null, 2);
    }
    if (param) {
        return param;// JSON.stringify(param, null, 2);
    } else {
        return param;
    }
};

const all = format((info) => {
    const splat = info[SPLAT] || [];
    const message = formatObject(info.message);
    const rest = splat.map(formatObject).join(' ');
    info.message = `${message} ${rest}`;
    return info;
});

const myFormat = printf((info) => {
    if (info instanceof Error) {
        return `${info.timestamp} ${info.level}: ${info.message}; ${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

const loggingInit = async () => {

    if (!global.config) {
        global.config = {};
    }

    global.config.log_level = process.env.LOG_LEVEL || "debug";
    global.config.log_file_directory = process.env.LOG_FILE_DIRECTORY || path.join(__dirname, "/../../log");

    const direxists = await dirExists(global.config.log_file_directory);
    if (!direxists) {
        await mkDir(global.config.log_file_directory);
    }

    const options = {
        file: {
            name: "process-log",
            filename: path.join(global.config.log_file_directory, '/process.log'),
            json: false,
            level: global.config.log_level,
            maxsize: 5242880, // 5MB
            maxFiles: 1000,
            handleExceptions: false,
        },
        exceptions_file: {
            name: "exception-log",
            filename: path.join(global.config.log_file_directory, '/exception.log'),
            json: false,
            handleExceptions: true,
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 1000,
        },
        json_file: {
            level: global.config.log_level,
            filename: path.join(global.config.log_file_directory, '/process.log'),
            handleExceptions: true,
            json: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        },
        console: {
            level: 'debug',
            handleExceptions: true,
            json: false,
            format: combine(format.colorize({
                all: true,
            })),
        },
    };

    const logger = createLogger({
        format: combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            all(),
            myFormat,
        ),
        transports: [
            new transports.File(options.exceptions_file),
            new transports.File(options.file),
            new transports.Console(options.console)],
    });


    logger.extend = () => {
        ['log', 'profile', 'startTimer']
            .concat(Object.keys(logger.levels))
            .forEach((method) => {
                console[method] = () => {
                    return logger[method](arguments);
                };
            });
    };

    logger.extend(console);

    console.info("Logging Initialized");


};


module.exports.loggingInit = loggingInit;
