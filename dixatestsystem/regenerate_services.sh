#!/bin/bash

generate_service () {
   DIR_NAME=$1
   GENERATOR_JAR=openapi-generator-cli-5.1.0.jar
   SERVER_GENERATOR='nodejs-express-server'
   CLIENT_GENERATOR='typescript-axios'

   java -jar ${GENERATOR_JAR} generate \
      -i ${DIR_NAME}/openapi.yaml \
      -g ${SERVER_GENERATOR} \
      -o "${DIR_NAME}"

   java -jar ${GENERATOR_JAR} generate \
      -i ${DIR_NAME}/openapi.yaml \
      -g ${CLIENT_GENERATOR} \
      -o "../ts-api/src/${DIR_NAME}"
}

services_to_generate=( 
   "conversation-service"
   "message-service"
   "queue-service"
   # "offer-service"
   # "user-service"
)

for i in "${services_to_generate[@]}"
do
   echo ""
   echo "REGENERATING $i"
   echo ""
   generate_service $i > /dev/null
done

echo ""
echo "UPDATING CLIENT PACKAGE"
echo ""

cd "../ts-api"
npm version minor > /dev/null
npm i
npm publish
cd ../dixatestsystem

services_to_update=( 
   "conversation-service"
   "message-service"
   "queue-service"
   # "offer-service"
   # "user-service"
)

for i in "${services_to_update[@]}"
do
   echo ""
   echo "UPGRADING CLIENT LIBS: $i"
   echo ""
   cd "${i}"
   npm update
   cd ..
done

echo ""
echo "DONE"
echo ""
