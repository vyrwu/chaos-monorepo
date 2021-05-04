#!/bin/bash

dirs=(
  "dixatestsystem/conversation-service"
  "dixatestsystem/message-service"
  "dixatestsystem/queue-service"
  "loadgenerator"
  "dixatestplaform/chaos"
)

root="${PWD}"

for i in "${dirs[@]}"
do
  echo ""
  echo "Installing ${i}..."
  echo ""
  cd "${i}/deploy"
  ./install_k8s.sh
  cd "${root}"
done
