#!/bin/bash

generate_service () {
   DIR_NAME=$1
   GENERATOR_JAR=openapi-generator-cli-5.1.0.jar
   SERVER_GENERATOR='nodejs-express-server'
   CLIENT_GENERATOR='typescript-axios'

   rm -r ${DIR_NAME}/generated_backup/*
   cp -r "${DIR_NAME}/generated/" "${DIR_NAME}/generated_backup/"

   java -jar ${GENERATOR_JAR} generate \
      -i ${DIR_NAME}/openapi.yaml \
      -g ${SERVER_GENERATOR} \
      -o "${DIR_NAME}/generated/server"

   java -jar ${GENERATOR_JAR} generate \
      -i ${DIR_NAME}/openapi.yaml \
      -g ${CLIENT_GENERATOR} \
      -o "${DIR_NAME}/generated/client"
}

services=( 
   "conversation-service"
   "message-service"
   "queue-service"
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
echo "DONE"
echo ""
