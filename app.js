require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

global.fetch = require('node-fetch')

const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use('/',async function (req,res,next){
    if(!Object.keys(req.body).length){
        //return setting page if there is no request relay data.
        res.sendFile(__dirname+'/public/setting.html')
    }else{
        let startTime = Date.now()

        var relays = req.body
        var thisrequest = relays.shift() //remove this request from this relay

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
                    callresult = await response.json()
                }catch(err){
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
                    const response = await fetch(nextrequest.url,{
                        method:'POST',
                        headers:{
                        'Content-Type':'application/json',
                        },
                        body:JSON.stringify(relays)
                    })

                    //response from next choi
                    const status = response.status
                    data = await response.json()
                }catch(err){
                    error = err
                }
            }

            let code = thisrequest.code
            if(!thisrequest.error){
                code = 200
            }

            let returnMessages = data ? data: []
            returnMessages.unshift({id:thisrequest.id,url:thisrequest.url,code:code,elapsed:Date.now()-startTime,error:error.message,callstatuses:callstatuses,callresults:callresults,calltimes:calltimes})
            res.json(returnMessages)
        }
    }
});

module.exports = app;
