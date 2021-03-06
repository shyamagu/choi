# choi

The purpose of this application is that to evaluate your infrastracture such like cloud-VMs, containers and k8s.
It's easy to create cloud infrastraucre but it's still necesarry to prepare application or middleware to check operations, network, monitoring on the infrastracture from the view of application layer.

choi (check of infrastracture) is a super simple web-application using vuejs and node-express and this app can easily relay http(s) request, call external apis and ouput log like below.

![choi overview](./choi_overview.png)

# How to setup

For each machine/vm/container
1. install nodejs
2. git clone https://github.com/shyamagu/choi.git
3. cd /choi
4. npm install
5. npm start

then you can access a choi's setting page at this server (http://YOUR_SERVER_URL:3000) , any path available /*

## Custom PORT

if you want to change PORT, please note your PORT in a "/.env" file
````
PORT=3001
````

## HTTPS server

if you want to use HTTPS, please add HTTPS configuration(PORT,pem file path, crt file path) in a "/.env" file like below.

*Not recommended, but if you want to use a self signed certification, use NODE_TLS_REJECT_UNAUTHORIZED=0 in this file.
````
...
HTTPS_PORT=5000
HTTPS_PEM=./key/private_key.pem
HTTPS_CRT=./key/server.crt
NODE_TLS_REJECT_UNAUTHORIZED=0
````

## Custom log

choi can output custom log.
if you want to customize log format, rollup setting and so on, please customize "log4js.config.json" file in the root folder.

## Dockerfile sample
````
FROM node:14-alpine

# install Git & Bash
RUN apk update && apk add git && apk add bash

WORKDIR /choi

COPY . .

# yarn install
RUN yarn install

EXPOSE 3000

CMD ["./dumb-init","yarn","start"]
````

## Setup tips for Windows user

- Don't forget to open port at Windows Firewall

# How to use

"choi" is a no-code app application. you can configure server url, application emulation, and call external apis and custom log settings.

Below picture shows the sample setting and show how to work.
Push "Send Request" button to start the process and you can see all results of calling apis and each network latency.

![choi sample setting](./choi_setting_sample.png)

## Export and import setting

you can export and import setting to use "export" button and "import" button at the top of choi page.

output json file includes all settings and all result.

# Evaluate your infrastracture

Using choi, you can evaluate your monitoring tool, network, infrastracture to emulate application which has not yet been developed.

## Tips for Azure User

- try to call an Azure Instance Metadata Service([Windows](https://docs.microsoft.com/en-us/azure/virtual-machines/windows/instance-metadata-service?tabs=linux),[Linux](https://docs.microsoft.com/en-us/azure/virtual-machines/linux/instance-metadata-service?tabs=linux)) in choi to get metadata of your infrastracure.

