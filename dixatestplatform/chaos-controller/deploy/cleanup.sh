#!/bin/bash

namespace=$1

kubectl delete -n "${namespace}" -f kube/
