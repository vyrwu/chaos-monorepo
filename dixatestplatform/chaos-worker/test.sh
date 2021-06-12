#/bin/bash

bash clearJobs.sh
bash clearNamespaces.sh
AWS_PROFILE=security ./deploy.sh "${NPM_TOKEN}"
curl -X 'POST' \
  'http://localhost:8080/chaos/test/d1bed139-7e07-4fe1-9a77-239f12880f6e/run/canary' \
  -H 'accept: */*' \
  -d ''
