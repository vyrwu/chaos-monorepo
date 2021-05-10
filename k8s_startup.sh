#!/bin/bash

dirs=(
  "loadgenerator"
  "dixatestplatform/chaos-controller"
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
echo "Installing microservices"
echo ""
kubectl apply -f k8s-deployer/k8sYamls -R
