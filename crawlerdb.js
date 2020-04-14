const rp=require("request-promise");
const conf=require("./config");
const Sequelize=require('sequelize');
const dbmodel=require('./dbmodel');

const sql=new Sequelize(...conf.sequelize);
const models=dbmodel(sql);
const Monitoring=models.Monitoring;
const Data=models.Data;
const MonitorUser=models.MonitorUser;

const intervals={};
const intervalsUser={};
function doMonitor(config) {
    if(!intervals[""+config.bvid])intervals[""+config.bvid]=1;
    rp({
        uri: 'https://api.bilibili.com/x/web-interface/archive/stat',
        qs: {
            bvid: config.bvid
        },
        headers: {
            'User-Agent': '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
        },
        json: true
    }).then(data => {
        delete data.data.no_reprint;
        delete data.data.evaluation;
        delete data.data.argue_msg;
        delete data.data.copyright;
        data.data.time=Date.now();
        Data.create(data.data);
        console.log(config.bvid+"\t"+data.data.view+"V\t"+data.data.favorite+"F");
    }).catch(e => console.log(config.bvid+" "+e))
        .finally(() => {
            //console.log(config.bvid + " Requested");
            if(!config.expireDate || config.expireDate>Date.now())intervals[""+config.bvid]=setTimeout(() => doMonitor(config), config.interval);
        }
    );
}

function monitorDaemon(){
    Monitoring.findAll().then((data)=>{
        data.forEach(item=>{
            if((!item.expireDate || item.expireDate>Date.now())&& !intervals[""+item.bvid]){
                doMonitor(item);
                console.log("New AV Monitor Task:"+item.bvid);
            }
            if((!item.title)||(!item.publishDate)){
                //https://api.bilibili.com/x/web-interface/view?aid=74594675
                rp({
                    uri: 'https://api.bilibili.com/x/web-interface/view',
                    qs: {
                        bvid: item.bvid
                    },
                    headers: {
                        'User-Agent': '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
                    },
                    json: true
                }).then(data=>{
                    if(!data || !data.data){
                        Monitoring.update({title:item.title||"",publishDate:item.publishDate||new Date(0)},{where:{id:item.id}});
                    }
                    if(!item.publishDate){
                        Data.create({
                            bvid: item.bvid,
                            "view": 0,
                            "danmaku": 0,
                            "reply": 0,
                            "favorite": 0,
                            "coin":0,
                            "share": 0,
                            "like": 0,
                            "now_rank": 0,
                            "his_rank": 0,
                            "time": new Date(+data.data.pubdate*1000)
                        })
                    }
                    Monitoring.update({title:data.data.title,publishDate:new Date(+data.data.pubdate*1000)},{where:{id:item.id}});
                })
            }
        });
        const bvids=data.map(d=>d.bvid);
        Object.keys(intervals).forEach(i=>{
            if(bvids.indexOf(i)<0){
                clearTimeout(intervals[i]);
                console.log("Removing AV Monitor Task:"+i);
                delete intervals[i];
            }
        })
    });
    setTimeout(monitorDaemon,30000);
}

function doMonitorUser(config){
    if(!intervalsUser[""+config.mid])intervalsUser[""+config.mid]=1;
    rp({
        uri: 'https://api.bilibili.com/x/space/arc/search',
        qs: {
            mid: config.mid,
            ps:30,
            tid:0,
            pn:1,
            order:"pubdate"
        },
        headers: {
            'User-Agent': '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
        },
        json: true
    }).then(data => {
        data.data.list.vlist.forEach(obj=>{
            if(!intervals[""+obj.bvid])
                if(Date.now()-new Date(obj.created*1000)<config.monitorWithinDays*86400000){
                    Monitoring.create({
                        bvid:obj.bvid,
                        title:obj.title,
                        interval:config.defaultInterval,
                        expireDate:new Date(+new Date(obj.created*1000)+config.monitorWithinDays*86400000)
                    }).catch(e=>{console.log(config.mid+" "+obj.bvid+" "+e)});
                    console.log(config.mid+" "+obj.bvid);
                }
        });

    }).catch(e => console.log(config.mid+" "+e)).finally(() => {
            intervalsUser[""+config.mid]=setTimeout(() => doMonitorUser(config), config.interval);
        }
    );
}

function monitorUserDaemon(){
    MonitorUser.findAll().then((data)=>{
        data.forEach(item=>{
            if(!intervalsUser[""+item.mid]){
                doMonitorUser(item);
                console.log("New User Monitor Task:"+item.mid);
            }
        });
        const mids=data.map(d=>d.mid);
        Object.keys(intervalsUser).forEach(i=>{
            if(mids.indexOf(+i)<0){
                console.log("Removing User Monitor Task:"+i);
                clearTimeout(intervalsUser[i]);
                delete intervalsUser[i];
            }
        })
    });
    setTimeout(monitorUserDaemon,30000);
}

sql.sync().then(()=>{
    Monitoring.bulkCreate(conf.monitor,{updateOnDuplicate:["bvid","interval","expireDate","title"]});
    MonitorUser.bulkCreate(conf.monitorUser,{updateOnDuplicate:["mid","monitorWithinDays","defaultInterval","interval"]});
    monitorDaemon();
    setTimeout(monitorUserDaemon,5000);
});