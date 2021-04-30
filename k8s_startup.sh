#!/bin/bash

dirs=(
  "dixatestsystem/conversation-service"
  "dixatestsystem/message-service"
  "dixatestsystem/queue-service"
  "loadgenerator"
)

root="${PWD}"

for i in "${dirs[@]}"
do
  cd "${i}/deploy"
  ./install_k8s.sh
  cd "${root}"
done
