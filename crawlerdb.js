const rp=require("request-promise");
const conf=require("./config");
const Sequelize=require('sequelize');
const dbmodel=require('./dbmodel');

const sql=new Sequelize(conf.sequelize);
const models=dbmodel(sql);
const Monitoring=models.Monitoring;
const Data=models.Data;
const MonitorUser=models.MonitorUser;

const intervals={};
const intervalsUser={};
function doMonitor(config) {
    if(!intervals[""+config.av])intervals[""+config.av]=1;
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
        delete data.data.bvid;
        delete data.data.no_reprint;
        delete data.data.evaluation;
        delete data.data.argue_msg;
        delete data.data.copyright;
        data.data.time=Date.now();
        Data.create(data.data);
        console.log(config.av+"\t"+data.data.view+"V\t"+data.data.favorite+"F");
    }).catch(e => console.log(config.av+" "+e)).finally(() => {
            //console.log(config.av + " Requested");
            if(!config.expireDate || config.expireDate>Date.now())intervals[""+config.av]=setTimeout(() => doMonitor(config), config.interval);
        }
    );
}

function monitorDaemon(){
    Monitoring.findAll().then((data)=>{
        data.forEach(item=>{
            if((!item.expireDate || item.expireDate>Date.now())&& !intervals[""+item.av]){
                doMonitor(item);
                console.log("New AV Monitor Task:"+item.av);
            }
            if(!item.title){
                //https://api.bilibili.com/x/web-interface/view?aid=74594675
                rp({
                    uri: 'https://api.bilibili.com/x/web-interface/view',
                    qs: {
                        aid: item.av
                    },
                    headers: {
                        'User-Agent': '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
                    },
                    json: true
                }).then(data=>{
                    item.title=data.data.title;
                    Monitoring.update({title:data.data.title},{where:{id:item.id}});
                })
            }
        });
        const avs=data.map(d=>d.av);
        Object.keys(intervals).forEach(i=>{
            if(avs.indexOf(+i)<0){
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
            if(!intervals[""+obj.aid])
                if(Date.now()-new Date(obj.created)<config.monitorWithinDays*86400000){
                    Monitoring.create({
                        av:+obj.aid,
                        title:obj.title,
                        interval:config.defaultInterval,
                        expireDate:new Date(+new Date(obj.created)+config.monitorWithinDays*86400000)
                    }).catch(e=>{})
                    console.log(config.mid+" "+obj.aid);
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
    console.log("Success");
    conf.monitor.forEach(obj=>Monitoring.create(obj).catch(e=>{}));
    conf.monitorUser.forEach(obj=>MonitorUser.create(obj).catch(e=>{}));
    monitorDaemon();
    setTimeout(monitorUserDaemon,25000);
});