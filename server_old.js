const http = require('http');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const logEvents = require('./logEvents');
const EventEmitter = require('events');

class Logger extends EventEmitter { };
const myLogger = new Logger();

myLogger.on('inf', (msg) => logEvents('INF', msg));
myLogger.on('wrn', (msg) => logEvents('WRN', msg));
myLogger.on('err', (msg) => logEvents('ERR', msg));

const PORT = process.env.PORT || 3500;

const serveFile = async(filePath,contentType, response) => {
    try {
        const rawData = await fsPromises.readFile(
            filePath,
            !contentType.includes('image')
                ? 'utf8'
                : ''
        );
        const data = contentType === 'application/json'
            ? JSON.parse(rawData)
            : rawData;
        response.writeHead(
            filePath.includes('404.html')
            ? 404
            : 200,
            {'Content-Type' : contentType}
        );
        response.end(
            contentType === 'application/json'
                ? JSON.stringify(data)
                : data
        );
    } catch (err) {
        myLogger.emit('err', `name: ${err.name}, msg: ${err.message}`);
        response.statusCode = 500;
        response.end;
    }
}

const server = http.createServer((req, res) => {
    myLogger.emit('inf', `${req.method} ${req.url}`);

    const extension = path.extname(req.url);
    let contentType;
    switch (extension) {
        case '.css':
            contentType = 'text/css';
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.jpg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.txt':
            contentType = 'text/plain';
            break;    
        default:
            contentType = 'text/html';
            break;
    }

    let filePath =
        contentType === 'text/html' && req.url === '/'
            ? path.join(__dirname, 'views', 'index.html')
            : contentType === 'text/html' && req.url.slice(-1) === '/'
                ? path.join(__dirname, 'views', req.url, 'index.html')
                : contentType === 'text/html' 
                    ? path.join(__dirname, 'views', req.url)
                    : path.join(__dirname, req.url);
    
    if (!extension && req.url.slice(-1) !== '/') filePath += '.html';

    const fileExists = fs.existsSync(filePath);
    
    if (fileExists){
        serveFile(filePath, contentType, res);
    } else {
        switch (path.parse(filePath).base) {
            //301 = redirect
            case 'old-page.html':
                res.writeHead(301, { 'Location' : '/new-page.html'});
                res.end();
                break;
            case 'www-page.html':
                    res.writeHead(301, { 'Location' : '/'});
                    res.end();
                    break;        
            default:
                //404 = not found
                serveFile(path.join(__dirname, 'views', '404.html'), 'text/html', res);
                break;
        }
    }


})

server.listen(PORT, () => myLogger.emit('inf', `Server running on port ${PORT}`))

//TODO: Review
// setTimeout(() => {
//     myEmitter.emit('log', 'Log event emitted!');
// }, 2000);