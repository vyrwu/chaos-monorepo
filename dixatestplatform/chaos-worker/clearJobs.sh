#/bin/bash

allJobs=$(kubectl get jobs -nproduction -ojson | jq -r '.items | map(.metadata.name) | .[]')
echo "${allJobs}" | xargs -I {} kubectl delete job -n production {}
