#!/bin/bash

namespace=$1 || 'production'

echo ""
echo "Removing microservices"
echo ""
kubectl delete -f k8s-deployer/k8sYamls -R -n "${namespace}"

root="${PWD}"

dirs=(
  "loadgenerator"
  "dixatestplatform/chaos-controller"
  "k8s-deployer"
)

for i in "${dirs[@]}"
do
  echo ""
  echo "Removing ${i}..."
  echo ""
  cd "${i}/deploy"
  ./cleanup.sh "${namespace}"
  cd "${root}"
done
