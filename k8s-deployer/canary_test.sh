#/bin/bash

RUN wget "http://stedolan.github.io/jq/download/linux64/jq" && chmod 755 jq
mv jq /bin/

testId=$(curl -X POST http://chaos-controller/chaos/test -H 'Content-Type: application/json' -d '{"displayName": "test", "upstreamService": "conversation-service", "downstreamService": "message-service", "spec": {"fault": {"abort": {"percentage": {"value": "10"}, "httpStatus": "500"}}}}' | jq -r '.id')
curl -X POST "http://chaos-controller/chaos/test/6d9c9a70-78fa-4399-a29c-d146b7448815/run/canary"
curl http://chaos-controller/chaos/runs
curl -X POST localhost:8080/deploy/chaosTest -H 'Content-Type: application/json' -d '{"mode": "canary", "runId": "8a2fa756-af61-417d-8e2d-bb3a2c19ba57"}'
