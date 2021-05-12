#!/bin/bash

namespace="${1:-production}"
kubectl create namespace "${namespace}"
kubectl label namespace "${namespace}" istio-injection=enabled

echo ""
echo "Installing microservices"
echo ""
kubectl apply -f k8s-deployer/k8sYamls -R -n "${namespace}"

root="${PWD}"

dirs=(
  "loadgenerator"
  "dixatestplatform/chaos-controller"
  "k8s-deployer"
)

for i in "${dirs[@]}"
do
  echo ""
  echo "Installing ${i}..."
  echo ""
  cd "${i}/deploy"
  ./install_k8s.sh "${namespace}"
  cd "${root}"
done

