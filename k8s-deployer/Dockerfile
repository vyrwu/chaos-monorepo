FROM node:14
ARG NPM_TOKEN
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
RUN curl -LO "https://dl.k8s.io/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
# RUN echo "$(<kubectl.sha256) kubectl" | sha256sum --check
RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
WORKDIR /usr/src/app
COPY .npmrc .npmrc
COPY package*.json ./
RUN npm install
RUN rm -f .npmrc
COPY . .
EXPOSE 8080
CMD [ "node", "index.js" ]
