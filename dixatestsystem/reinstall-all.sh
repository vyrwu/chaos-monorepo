#!/bin/bash

services=(
    "conversation-service"
    "message-service"
    "queue-service"
)

for i in "${services[@]}"
do
    cd "${i}/deploy"
    kubectl apply -n default -f kube/
    cd ../..
done
