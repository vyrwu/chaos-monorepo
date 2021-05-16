FROM node:14
ARG NPM_TOKEN
WORKDIR /usr/src/app
COPY .npmrc .npmrc
COPY package*.json ./
RUN npm install
RUN rm -f .npmrc
COPY . .
EXPOSE 8080
