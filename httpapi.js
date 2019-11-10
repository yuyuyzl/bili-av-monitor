const rp=require("request-promise");
const conf=require("./config");
const http=require("http");
const url=require("url");
const Sequelize=require('sequelize');
const dbmodel=require('./dbmodel');

const sql=new Sequelize(...conf.sequelize);
const Op=Sequelize.Op;
const models=dbmodel(sql);
const Monitoring=models.Monitoring;
const Data=models.Data;

http.createServer(async (req, res) => {
    const urlobj=url.parse(req.url);
    try {
        const args = {};
        if(urlobj.query)urlobj.query.split("&").forEach(s => args[s.split('=')[0]] = unescape(s.split("=")[1]));
        const av = urlobj.pathname.split("/").pop();
        if (av==="action"){
            if(conf.api.secret.indexOf(args.secret)>=0){
                switch (args.action) {
                    case "av":{
                        await Monitoring.bulkCreate([{
                            av:args.av,
                            interval:args.interval?args.interval:conf.api.defaultIntervalAV,
                            expireDate:args.expireDate?new Date(args.expireDate):null,
                            title:args.title
                        }],{updateOnDuplicate:["av","interval","expireDate","title"]});
                        res.writeHead(200, {
                            "content-type": "text/plain; charset=utf-8",
                            "Access-Control-Allow-Origin": "*"
                        });
                        res.end(JSON.stringify({result:"success"}));
                        return;
                    }
                    case "user":{
                        await Monitoring.bulkCreate([{
                            mid:args.mid,
                            interval:args.interval?args.interval:conf.api.defaultIntervalUser,
                            monitorWithinDays:args.monitorWithinDays,
                            defaultInterval:args.defaultInterval
                        }],{updateOnDuplicate:["mid","monitorWithinDays","defaultInterval","interval"]});
                        res.writeHead(200, {
                            "content-type": "text/plain; charset=utf-8",
                            "Access-Control-Allow-Origin": "*"
                        });
                        res.end(JSON.stringify({result:"success"}));
                        return;
                    }
                }
            }
        }
        let data;
        if (av === "monitor") {
            data = await Monitoring.findAll({
                where: {
                    updatedAt: {
                        [Op.gte]: args.after ? new Date(args.after) : new Date(0)
                    }
                },
                order:[["updatedAt","desc"]]
            });
        } else {
            data = await Data.findAll({
                where: {
                    aid: +av,
                    updatedAt: {
                        [Op.gte]: args.after ? new Date(args.after) : new Date(0)
                    }
                }, order: ["time"]
            });
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
                res.end(JSON.stringify({
                    data:data.map(obj => args.item.map(key => obj[key])),
                    updatedAt:new Date().toISOString()
                }));
            else
                res.end(JSON.stringify({
                    data:data,
                    updatedAt:new Date().toISOString()
                }));
            return ;
        }
    }catch (e) {
        console.error(e)
    }
    res.writeHead(404, {
        "content-type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
    });
    res.end("404 Not found");
}).listen(conf.api.port);