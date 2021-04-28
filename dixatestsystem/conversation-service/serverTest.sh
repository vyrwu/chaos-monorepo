#!/bin/bash
echo "POST conversation"
curl -X POST http://localhost:8080/v1/conversation -d '{"id": "6866c090-44f0-446b-9ec8-b52e3be4bf15"}' -H 'Content-Type: application/json'
echo ""
echo "GET conversation"
curl -X GET http://localhost:8080/v1/conversation/6866c090-44f0-446b-9ec8-b52e3be4bf15
echo ""
echo "GET conversations"
curl -X GET http://localhost:8080/v1/conversations
echo ""
echo "DELETE conversation"
curl -X DELETE http://localhost:8080/v1/conversation/6866c090-44f0-446b-9ec8-b52e3be4bf15
echo ""
curl -X GET http://localhost:8080/v1/conversation/6866c090-44f0-446b-9ec8-b52e3be4bf15
echo ""
