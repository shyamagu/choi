require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var cors = require('cors')
var log4js = require('log4js')
log4js.configure('log4js.config.json')
var logger = log4js.getLogger('choi')
var app = express();

app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

global.fetch = require('node-fetch')

const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use('/choi/hints', function(req,res,next){
    let choiGetHintsFlag = req.headers["choi-get-hints"];
    if(choiGetHintsFlag==="true"){
        let hints = []
        hints.push({name:"Azure instance metadata", hint:"GET http://169.254.169.254/metadata/instance?api-version=2020-12-01 \nw/header {\"Metadata\":\"true\"}"})
        hints.push({name:"Azure instance shcedule event", hint:"GET http://169.254.169.254/metadata/scheduledevents?api-version=2019-01-01 \nw/header {\"Metadata\":\"true\"}"})
        hints.push({name:"Azure AD token and headers", hint:"use \"x-ms-token-aad-id-token\" and w/header {\"Authorization\": \"Bearer %TOKEN%\"}"})
        res.json(hints)
    }else{
        next()
    }
});

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
        next()
    }
})


app.use('/',async function (req,res,next){
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
        let receivecode = ""
        let response
        if(relays.length > 0){
            let nextrequest = relays[0]
            try{
                let jsonheader = nextrequest.headers? JSON.parse(nextrequest.headers) : {}

                response = await fetch(nextrequest.url,{
                    method:'POST',
                    headers:jsonheader,
                    body:JSON.stringify(relays)
                })

                //response from next choi
                receivecode = response.status
                data = await response.json()
            }catch(err){
                logger.error(err)
                logger.error(response)
                error = err
            }
        }

        let code = thisrequest.code
        if(!thisrequest.error){
            code = 200
        }

        let returnMessages = data ? data: []
        returnMessages.unshift({id:thisrequest.id,url:thisrequest.url,code:code,resCode:receivecode,elapsed:Date.now()-startTime,error:error.message,callstatuses:callstatuses,callresults:callresults,calltimes:calltimes,processenv:process.env})
        res.json(returnMessages)
    }
});

module.exports = app;
