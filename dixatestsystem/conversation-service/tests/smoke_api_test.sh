#!/bin/bash
echo ""
echo "POST conversation"
curl -X POST http://localhost:8080/v1/conversation -d '{"channel": "widget", "message": "Hello! I need help. Please come and save me!"}' -H 'Content-Type: application/json'
echo ""
echo "GET conversations"
curl -X GET http://localhost:8080/v1/conversations
