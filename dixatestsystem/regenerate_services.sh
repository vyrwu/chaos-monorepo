#!/bin/bash

generate_service () {
   DIR_NAME=$1
   GENERATOR_JAR=openapi-generator-cli-5.1.0.jar
   SERVER_GENERATOR='nodejs-express-server'
   CLIENT_GENERATOR='typescript-axios'

   rm -rf "backup/${DIR_NAME}"
   cp -r "${DIR_NAME}" "backup/${DIR_NAME}"

   java -jar ${GENERATOR_JAR} generate \
      -i ${DIR_NAME}/openapi.yaml \
      -g ${SERVER_GENERATOR} \
      -o "${DIR_NAME}"

   java -jar ${GENERATOR_JAR} generate \
      -i ${DIR_NAME}/openapi.yaml \
      -g ${CLIENT_GENERATOR} \
      -o "ts-api/src/${DIR_NAME}"
}

npm_token=$1
if [ -z "$1" ]; then
    echo "please provide valid npm token"
    echo "usage ./regenerate_services.sh [npm_token]"
    exit 1
fi

services=( 
   "conversation-service"
   # "message-service"
   # "queue-service"
   # "offer-service"
   # "user-service"
)

for i in "${services[@]}"
do
   echo ""
   echo "REGENERATING $i"
   echo ""
   generate_service $i > /dev/null
done

echo ""
echo "UPDATING CLIENT PACKAGE"
echo ""

cd "ts-api"
npm version minor
npm publish
cd ..

for i in "${services[@]}"
do
   echo ""
   echo "UPGRADING CLIENT LIBS: $i"
   echo ""
   cd "${i}"
   npm update
   npm audit fix
done

echo ""
echo "DONE"
echo ""
