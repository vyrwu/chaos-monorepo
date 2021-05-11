#!/bin/bash

namespace=$1 || 'production'

echo ""
echo "Using namespace '${namespace}'"
echo ""

echo ""
echo "Installing microservices"
echo ""
kubectl apply -f k8s-deployer/k8sYamls -R -n "${namespace}"

root="${PWD}"

dirs=(
  "loadgenerator"
  "dixatestplatform/chaos-controller"
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

