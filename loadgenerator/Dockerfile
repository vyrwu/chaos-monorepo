FROM node:14
ARG NPM_TOKEN
WORKDIR /usr/src/app
COPY .npmrc .npmrc
COPY package*.json ./
RUN npm install
RUN rm -f .npmrc
COPY . .
RUN npm run build
RUN wget "http://stedolan.github.io/jq/download/linux64/jq" && chmod 755 jq && mv jq /bin/
CMD [ "node", "dist/index.js" ]
