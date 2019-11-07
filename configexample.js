/*
Copy this to config.js at the same directory
and that would be your config file.
 */

module.exports={
    monitor:[
        {
            av:74594675,
            interval:60000,
        },
        {
            av:74703041,
            interval:60000,
        }
    ],
    api: {
        port: 8088
    },
    sequelize:"mysql://biliavmonitor:biliavmonitor@localhost:3306/biliavmonitor"

};