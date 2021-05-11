#!/bin/bash

namespace=$1

kubectl apply -n "${namespace}" -f kube/
