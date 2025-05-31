FROM ubuntu:focal

RUN apt-get update
RUN apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
# upgrade the packages
RUN apt-get upgrade -y
RUN apt-get install -y nodejs
RUN apt-get install git -y

WORKDIR /home/path

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

RUN chmod -x main.sh
RUN chmod -x script.js

# considers this as an entrypoint and runs this script on startup of container
ENTRYPOINT [ "/home/app/main.sh" ]