const rp=require("request-promise");
const conf=require("./config");
const http=require("http");
const url=require("url");
const Sequelize=require('sequelize');
const dbmodel=require('./dbmodel');

const sql=new Sequelize(...conf.sequelize);
const models=dbmodel(sql);
const Monitoring=models.Monitoring;
const Data=models.Data;

http.createServer(async (req, res) => {
    const urlobj=url.parse(req.url);
    try {
        const args = {};
        if(urlobj.query)urlobj.query.split("&").forEach(s => args[s.split('=')[0]] = s.split("=")[1]);
        const av = urlobj.pathname.split("/").pop();
        let data;
        if (av === "monitor") {
            data = await Monitoring.findAll();
        } else {
            data = await Data.findAll({where: {aid: +av}, order: ["time"]});
        }
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