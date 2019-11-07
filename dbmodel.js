const Sequelize=require('sequelize');
const Model=Sequelize.Model;
module.exports=function(sql) {

    class Monitoring extends Model {
    }

    class Data extends Model {
    }

    Monitoring.init({
        av: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true
        },
        interval: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        expireDate: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        sequelize: sql, modelName: "monitoring"
    });

    Data.init({
        aid: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        "view": {
            type: Sequelize.INTEGER
        },
        "danmaku": {
            type: Sequelize.INTEGER
        },
        "reply": {
            type: Sequelize.INTEGER
        },
        "favorite": {
            type: Sequelize.INTEGER
        },
        "coin": {
            type: Sequelize.INTEGER
        },
        "share": {
            type: Sequelize.INTEGER
        },
        "like": {
            type: Sequelize.INTEGER
        },
        "now_rank": {
            type: Sequelize.INTEGER
        },
        "his_rank": {
            type: Sequelize.INTEGER
        },
        "time": {
            type: Sequelize.DATE,
            allowNull: false
        }
    }, {
        sequelize: sql, modelName: "data"
    });

    return{
        Monitoring,Data
    }
};