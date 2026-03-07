#!/bin/bash
API_KEY=$(grep PANEL_API_KEY ~/nexo-hub/backend/.env | cut -d= -f2)

curl -s -X POST http://localhost:3100/api/workers \
  -H 'Content-Type: application/json' \
  -H "X-API-Key: $API_KEY" \
  -d '{"name":"worker-01","host":"147.135.215.195","apiPort":8080,"notes":"Dedicated server ns3123291 - OCR/RAG worker"}'
echo ""
echo "DONE"
