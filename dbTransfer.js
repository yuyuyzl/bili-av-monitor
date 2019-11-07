const rp=require("request-promise");
const conf=require("./config");
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Sequelize=require('sequelize');

const Model=Sequelize.Model;
const adapter = new FileSync('db.json');
const db = low(adapter);

const sql=new Sequelize(conf.sequelize,{
    pool: {
        max: 50,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

class Monitoring extends Model{}
class Data extends Model{}

Monitoring.init({
    av:{
        type:Sequelize.INTEGER,
        allowNull:false,
        unique:true
    },
    interval:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    expireDate:{
        type:Sequelize.DATE,
        allowNull:true
    }
},{
    sequelize:sql,modelName:"monitoring"
});

Data.init({
    aid:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    "view": {
        type:Sequelize.INTEGER
    },
    "danmaku": {
        type:Sequelize.INTEGER
    },
    "reply": {
        type:Sequelize.INTEGER
    },
    "favorite": {
        type:Sequelize.INTEGER
    },
    "coin": {
        type:Sequelize.INTEGER
    },
    "share": {
        type:Sequelize.INTEGER
    },
    "like": {
        type:Sequelize.INTEGER
    },
    "now_rank": {
        type:Sequelize.INTEGER
    },
    "his_rank": {
        type:Sequelize.INTEGER
    },
    "time":{
        type:Sequelize.DATE,
        allowNull:false
    }
},{
    sequelize:sql,modelName:"data"
});

sql.sync().then(()=>{
    console.log("Success");
    conf.monitor.forEach(async obj=>{
        await Data.bulkCreate(db.get(obj.av).value().map(item=>{
            item.aid=obj.av;
            return item;
        }));
    });


});