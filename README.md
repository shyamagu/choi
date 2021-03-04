## choi

The purpose of this application is that to evaluate your infrastracture such like cloud-VMs, containers and k8s.
It's easy to create cloud infrastraucre but it's still necesarry to prepare application or middleware to check operations or network on the infrastracture from the view of application layer.

choi (check our infrastracture) is a super simple web-application using vuejs and node-express and this app can easily relay http(s) request and call external api like below.

![choi overview](./choi_overview.png)

## how to setup

for each machine/vm/container
1. install nodejs on your machine/vm/container
2. clone this repository
3. yarn install
4. yarn start

then you can access a choi page at this server (default: http://localhost:3000) , any path available /*

if you want to change PORT, please note your PORT in .env file
````
PORT=3001
````

if you want to use HTTPS, please add HTTPS configuration(PORT,cert file...) in .env file like below.

*Not recommend, but if you want to use self signed certification, please use NODE_TLS_REJECT_UNAUTHORIZED=0 in this file.
````
...
HTTPS_PORT=5000
HTTPS_PEM=./key/private_key.pem
HTTPS_CRT=./key/server.crt
NODE_TLS_REJECT_UNAUTHORIZED=0
````

### sample dockerfile
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

### for Windows user

- Don't forget to open port at Windows Firewall

