require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var cors = require('cors')
var log4js = require('log4js')
//var logger = require('morgan');
log4js.configure('log4js.config.json')
var logger = log4js.getLogger('choi')
var app = express();

//app.use(logger('dev'));
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

global.fetch = require('node-fetch')

const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use('/choi/headers', function(req,res,next){
    let choiGetHeaderFlag = req.headers["choi-get-headers"];
    if(choiGetHeaderFlag==="true"){
        res.json(req.headers)
    }else{
        next()
    }
});

app.use('/',async function (req,res,next){
    if(!Object.keys(req.body).length){
        //return setting page if there is no request relay data.
        res.sendFile(__dirname+'/public/setting.html')
    }else{
        let startTime = Date.now()

        var relays = req.body
        var thisrequest = relays.shift() //remove this request from this relay

        //log
        for (let i=0;i<thisrequest.lognums;i++){
            switch (thisrequest.loglevels[i]) {
                case "FATAL":
                    logger.fatal(thisrequest.logdetails[i])
                    break;
                case "ERROR":
                    logger.error(thisrequest.logdetails[i])
                    break;
                case "WARN":
                    logger.warn(thisrequest.logdetails[i])
                    break;
                case "INFO":
                    logger.info(thisrequest.logdetails[i])
                    break;
                case "DEBUG":
                    logger.debug(thisrequest.logdetails[i])
                    break;
                case "TRACE":
                    logger.trace(thisrequest.logdetails[i])
                    break;
                default:
                    break;
            }
        }

        //call GET
        let callstatuses= []
        let callresults = []
        let calltimes = []
        for (let i=0;i<thisrequest.apicalls;i++){
            let callstatus = ""
            let callresult = ""
            let headersjson = ""
            let callmethod = thisrequest.apicallmethod[i]
            let calltime = Date.now()

            if(thisrequest.apicallheaders[i]){
                headersjson = JSON.parse(thisrequest.apicallheaders[i])
            }

            if(thisrequest.apicallurls[i]){
                try{
                    let response;
                    if(callmethod === "GET"){
                        response = await fetch(thisrequest.apicallurls[i],{
                            method:'GET',
                            headers:headersjson,
                        })
                    }else{
                        response = await fetch(thisrequest.apicallurls[i],{
                            method:'POST',
                            headers:headersjson,
                            body:thisrequest.apicallbody[i]
                        })
                    }
                    callstatus = response.status
                    var responseForText = response.clone()
                    
                    try{
                        callresult = await response.json()
                    }catch(jsonerr){
                        callresult = await responseForText.text()
                    }
                }catch(err){
                    logger.error(err)
                    callresult = {error:err.message}
                }
            }
            callstatuses.push(callstatus)
            callresults.push(callresult)
            calltimes.push(Date.now()-calltime)
        }

        //sleep
        if(thisrequest.delay){
            await _sleep(thisrequest.delay)
        }
        //error respond
        if(thisrequest.error == true){
            res.status(thisrequest.code)
        }
        //timeout
        if(thisrequest.timeout == true){
            //not return the response and cause time-out
        }else{

            let error = ""
            let data  = ""
            if(relays.length > 0){
                let nextrequest = relays[0]
                try{
                    let jsonheader = nextrequest.headers? JSON.parse(nextrequest.headers) : {}

                    const response = await fetch(nextrequest.url,{
                        method:'POST',
                        headers:jsonheader,
                        body:JSON.stringify(relays)
                    })

                    //response from next choi
                    const status = response.status
                    data = await response.json()
                }catch(err){
                    logger.error(err)
                    error = err
                }
            }

            let code = thisrequest.code
            if(!thisrequest.error){
                code = 200
            }

            let returnMessages = data ? data: []
            returnMessages.unshift({id:thisrequest.id,url:thisrequest.url,code:code,elapsed:Date.now()-startTime,error:error.message,callstatuses:callstatuses,callresults:callresults,calltimes:calltimes,processenv:process.env})
            res.json(returnMessages)
        }
    }
});

module.exports = app;
