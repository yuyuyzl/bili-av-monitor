/*
Copy this to config.js at the same directory
and that would be your config file.
 */

module.exports={
    monitor:[
        {
            av:74594675,                                        //监视的AV号
            interval:60000,                                     //轮询周期，毫秒
            expireDate:new Date("2019-11-09 12:00:00")    //过期日期，超过这个日期则结束轮询任务，不设置则不结束。
        },
        {
            av:74703041,
            interval:60000,
        }
    ],
    monitorUser:[
        {
            mid:1534590,            //监视的用户ID
            monitorWithinDays:15,   //新稿件需要被监视的总天数，从稿件发布时间起计算。爬虫会自动将监视视频表中不存在的视频都添加进去，过期日期为发布时间加上该选项设定的天数。
            defaultInterval:120000, //新稿件默认的轮询周期，注意是av的interval。
            interval:120000         //用户默认的轮询周期
        }
    ],
    api: {
        port: 8088                  //API监听的端口号
    },
    sequelize:"mysql://biliavmonitor:biliavmonitor@localhost:3306/biliavmonitor"    //SQL服务器的URL，请确保使用的账号有对应数据库的完全访问权限

};