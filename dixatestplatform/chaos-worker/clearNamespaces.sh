#/bin/bash

allJobs=$(kubectl get ns -nproduction -ojson | jq -r '.items | map(.metadata.name) | .[]' | grep 'chaos-test')
echo "${allJobs}" | xargs -I {} kubectl delete ns {}
