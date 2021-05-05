#!/bin/bash

dirs=(
  "loadgenerator"
  "dixatestplatform/chaos"
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

echo ""
echo "Removing microservices"
echo ""
kubectl delete -f k8s-deployer/k8sYamls -R
