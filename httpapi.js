const rp=require("request-promise");
const conf=require("./config");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const http=require("http");
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({}).write();

http.createServer((req, res) => {

    const av=req.url.split("/").pop();
    const data=db.get(av).value();
    if(data) {
        res.writeHead(200, {
            "content-type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify(data));
    }else {
        res.writeHead(404, {
            "content-type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
        });
        res.end("404 Not found");
    }
}).listen(conf.api.port);