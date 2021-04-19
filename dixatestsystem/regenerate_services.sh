#!/bin/bash

generate_service () {
   DIR_NAME=$1
   GENERATOR_JAR=openapi-generator-cli-5.1.0.jar
   GENERATOR_NAME='nodejs-express-server'

   rm -r ${DIR_NAME}/last_backup/*
   mv ${DIR_NAME}/${GENERATOR_NAME} ${DIR_NAME}/last_backup
   rm -rf ${DIR_NAME}/${GENERATOR_NAME}
   java -jar ${GENERATOR_JAR} generate \
      -i ${DIR_NAME}/openapi.yaml \
      -g ${GENERATOR_NAME} \
      -o ${DIR_NAME}/${GENERATOR_NAME}
}

services=( 
   "conversation-service"
   "message-service"
   # "offer-service"
   "queue-service"
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
