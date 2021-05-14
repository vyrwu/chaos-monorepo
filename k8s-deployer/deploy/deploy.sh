#!/bin/bash

buildAndDeploy() {
    service_name=$1
    if [ -z "$1" ]; then
        echo "missing arg: [service_name] [npm_token]"
        echo "usage: buildAndDeploy [service_name] [npm_token]"
        exit 1
    fi

    npm_token=$2
    if [ -z "$2" ]; then
        echo "missing arg: [service_name] [npm_token]"
        echo "usage: buildAndDeploy [service_name] [npm_token]"
        exit 1
    fi

    aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 654015427134.dkr.ecr.eu-west-1.amazonaws.com

    git_sha=$(git rev-parse HEAD)
    image_name="654015427134.dkr.ecr.eu-west-1.amazonaws.com/chaos-secalekdev-${service_name}"
    now=$(date +%s)
    # docker build --pull --no-cache -t "${image_name}":latest -t "${image_name}:${git_sha}-${now}" -f ../Dockerfile --build-arg NPM_TOKEN="${npm_token}" ../.
    docker build --no-cache -t "${image_name}:latest" --build-arg NPM_TOKEN="${npm_token}" ../.
    docker push "${image_name}:latest"
    docker tag "${image_name}:latest" "${image_name}:${git_sha}"
    docker push "${image_name}:${git_sha}"
}

npm_token=$1
if [ -z "$1" ]; then
    echo "please provide valid npm token"
    echo "usage ./deploy [npm_token]"
    exit 1
fi

buildAndDeploy "k8s-deployer" "${npm_token}"

# kick the deployment to re-pull image
kubectl patch deployment k8s-deployer -n production -p "{\"spec\": {\"template\": {\"metadata\": { \"labels\": {  \"redeploy\": \"${now}\"}}}}}"
