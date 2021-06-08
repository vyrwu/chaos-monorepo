#/bin/bash

allJobs=$(kubectl get jobs -nproduction -ojson | jq -r '.items | map(.metadata.name) | .[]')
echo -n "${allJobs}" | xargs -I {} kubectl delete job -n production {}
