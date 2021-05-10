#/bin/bash

mode=$1
id=$(curl -X POST localhost:8080/chaos/test -d '{"name": "test"}' -H 'Content-Type: application/json' -s | jq -r '.newTest.id')

curl -X POST "localhost:8080/chaos/test/${id}/run/${mode}"
