#/bin/bash

testResponse=$(curl -X POST http://chaos-controller/chaos/test -H 'Content-Type: application/json' -d '{"displayName": "test", "upstreamService": "conversation-service", "downstreamService": "message-service", "spec": {"fault": {"abort": {"percentage": {"value": "10"}, "httpStatus": "500"}}}}' | jq -r '.id')
runId=$(curl -X POST "http://chaos-controller/chaos/test/${testId}/run/canary" | jq -r '.runId')
curl -X POST "http://chaos-controller/chaos/test/${testId}/run/production"
