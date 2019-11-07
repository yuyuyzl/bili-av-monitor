const rp=require("request-promise");
const conf=require("./config");
const Sequelize=require('sequelize');
const dbmodel=require('./dbmodel');

const sql=new Sequelize(conf.sequelize);
const models=dbmodel(sql);
const Monitoring=models.Monitoring;
const Data=models.Data;

const intervals={};
function doMonitor(config) {
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
            if(!config.expireDate || config.expireDate>Date.now())intervals[config.av]=setTimeout(() => doMonitor(config), config.interval);
        }
    );
}

function monitorDaemon(){
    Monitoring.findAll().then((data)=>{
        data.forEach(item=>{
            if((!item.expireDate || item.expireDate>Date.now())&& !intervals[item.av])doMonitor(item);
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
            if(avs.indexOf(i)<0){
                clearInterval(intervals[i]);
                delete intervals[i];
            }
        })
    });
    setTimeout(monitorDaemon,30000);
}

sql.sync().then(()=>{
    console.log("Success");
    conf.monitor.forEach(obj=>Monitoring.create(obj).catch(e=>{}));
    monitorDaemon()
});