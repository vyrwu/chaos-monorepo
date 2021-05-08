#!/bin/bash

buildAndDeploy() {
    service_name=$1
    if [ -z "$1" ]; then
        echo "missing arg: [service_name]"
        echo "usage: buildAndDeploy [service_name]"
        exit 1
    fi

    aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 654015427134.dkr.ecr.eu-west-1.amazonaws.com

    git_sha=$(git rev-parse HEAD)
    image_name="654015427134.dkr.ecr.eu-west-1.amazonaws.com/chaos-secalekdev-${service_name}"

    docker build -t "${image_name}":latest -t "${image_name}:${git_sha}" -f ../Dockerfile --build-arg --no-cache ../.

    docker push "${image_name}":latest
    docker push "${image_name}":$git_sha
}

buildAndDeploy "chaos-controller"

# kick the deployment to re-pull image
kubectl patch deployment chaos-controller -n default -p "{\"spec\": {\"template\": {\"metadata\": { \"labels\": {  \"redeploy\": \"$(date +%s)\"}}}}}"
