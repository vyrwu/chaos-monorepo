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
  echo "Removing ${i}..."
  echo ""
  cd "${i}/deploy"
  ./cleanup.sh
  cd "${root}"
done
