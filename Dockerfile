FROM node:14-alpine

# install Git & Bash
RUN apk update && apk add git && apk add bash

WORKDIR /choi
COPY . .

# yarn install
RUN yarn install

EXPOSE 3000

CMD ["./dumb-init", "yarn","start"]
