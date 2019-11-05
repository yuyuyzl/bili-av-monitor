const rp=require("request-promise");
const conf=require("./config");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const http=require("http");
const adapter = new FileSync('db.json');
const db = low(adapter);
const url=require("url");

// Set some defaults (required if your JSON file is empty)
db.defaults({}).write();

let lastRead=Date.now();

http.createServer((req, res) => {
    const urlobj=url.parse(req.url);
    try {
        const args = {};
        urlobj.query.split("&").forEach(s => args[s.split('=')[0]] = s.split("=")[1]);
        const av = urlobj.pathname.split("/").pop();
        if(Date.now()-lastRead>10000){
            db.read();
            lastRead=Date.now();
        }
        const data = db.get(av).value();

        if (data) {
            res.writeHead(200, {
                "content-type": "text/plain; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
            });
            if (args.item) {
                args.item = args.item.split(",");
            }
            if (args.item)
                res.end(JSON.stringify(data.map(obj => args.item.map(key => obj[key]))));
            else
                res.end(JSON.stringify(data));
        } else {
            res.writeHead(404, {
                "content-type": "text/plain; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
            });
            res.end("404 Not found");
        }
    }catch (e) {
        res.writeHead(404, {
            "content-type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
        });
        res.end("404 Not found");
    }
}).listen(conf.api.port);