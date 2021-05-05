#!/bin/bash

dirs=(
  "loadgenerator"
  "dixatestplatform/chaos"
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

echo ""
echo "Removing microservices"
echo ""
kubectl apply -f k8s-deployer/k8sYamls -R
