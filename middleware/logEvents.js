const { format } = require('date-fns');
//TODO: Delete later
//const { v4: uuid } = require('uuid');

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const logEvents = async (type, message) => {
    const logfileDate = `${format(new Date(), 'yyyyMMdd')}`;
    const logDateTime = `${format(new Date(), 'yyyy/MM/dd-HH:mm:ss')}`;
    // const logItem = `${dateTime}\t${uuid()}\t${message}\n`;
    const logItem = `${logDateTime}\t${type}\t${message}\n`;
    console.log(logItem);
    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
        }
        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', `eventLog-${logfileDate}.txt`), logItem);
    } catch (error) {
        console.log(error);
    }
}

const logger = (req, res, next) => {
    logEvents('', `${req.method} ${req.headers.origin} ${req.url}`);
    next();
}

module.exports = { logger, logEvents };