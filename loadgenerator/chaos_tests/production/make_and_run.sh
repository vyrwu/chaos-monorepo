#/bin/bash

testId=$(curl -X POST http://chaos-controller/chaos/test -H 'Content-Type: application/json' -d '{"displayName":"abort-50-availability","upstreamService":"conversation-service","downstreamService":"message-service","spec":{"fault":{"abort":{"percentage":{"value":"10"},"httpStatus":"500"}}},"successCriterion":{"name":"SLO","type":"availability","service":"conversation-service","comparisonOperator":">","threshold":"0.7"}}' | jq -r '.id')
curl -X POST "http://chaos-controller/chaos/test/${testId}/run/production"
