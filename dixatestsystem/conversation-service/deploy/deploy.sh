#!/bin/bash
export GIT_SHA=$(git rev-parse HEAD)
export AWS_PROFILE='security'
image_name="654015427134.dkr.ecr.eu-west-1.amazonaws.com/chaos-secalekdev-conversation-service"
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 654015427134.dkr.ecr.eu-west-1.amazonaws.com
docker build -t "${image_name}" ../.
docker build -t "${image_name}":latest -t "${image_name}":$GIT_SHA -f Dockerfile ../.
docker push "${image_name}":latest
docker push "${image_name}":$GIT_SHA
