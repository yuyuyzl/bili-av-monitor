const rp=require("request-promise");
const conf=require("./config");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({}).write();

function doMonitor(config) {
    if (!db.get(config.av).value()) db.set(config.av, []).write();
    rp({
        uri: 'https://api.bilibili.com/x/web-interface/archive/stat',
        qs: {
            aid: config.av
        },
        headers: {
            'User-Agent': '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
        },
        json: true
    }).then(data => {
        data.data.time = Date.now();
        delete data.data.aid;
        delete data.data.bvid;
        delete data.data.no_reprint;
        delete data.data.evaluation;
        delete data.data.argue_msg;
        delete data.data.copyright;
        db.get(config.av).push(data.data).write();
        console.log(config.av+"\t"+data.data.view+"V\t"+data.data.favorite+"F");
    }).catch(e => console.log(config.av+" "+e)).finally(() => {
            //console.log(config.av + " Requested");
            setTimeout(() => doMonitor(config), config.interval);
        }
    );
}

conf.monitor.map(doMonitor);

