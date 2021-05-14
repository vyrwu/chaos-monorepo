#!/bin/bash

services=(
    "conversation-service"
    "message-service"
    "queue-service"
)

for i in "${services[@]}"
do
    cd "${i}/deploy"
    ./deploy.sh "${NPM_TOKEN}"
    cd ../..
done
