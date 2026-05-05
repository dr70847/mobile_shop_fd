#!/bin/sh
# Regjistron sherbimet ne Consul Agent API (discovery + health checks).
set -eu
CONSUL="${CONSUL_HTTP_ADDR:-http://consul:8500}"

wait_consul() {
  i=0
  while [ "$i" -lt 40 ]; do
    if curl -sf "${CONSUL}/v1/status/leader" >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done
  echo "Consul nuk u pergjigj ne ${CONSUL}" >&2
  exit 1
}

register_http() {
  name=$1
  addr=$2
  port=$3
  path=$4
  payload=$(printf '{"ID":"%s","Name":"%s","Address":"%s","Port":%s,"Check":{"HTTP":"http://%s:%s%s","Interval":"10s","Timeout":"5s"}}' \
    "$name" "$name" "$addr" "$port" "$addr" "$port" "$path")
  curl -sf -X PUT "${CONSUL}/v1/agent/service/register" -d "$payload"
  echo "Registered ${name}"
}

wait_consul

register_http "auth-service" "auth-service" 4001 "/health"
register_http "catalog-service" "catalog-service" 4002 "/health"
register_http "order-service" "order-service" 4003 "/health"
register_http "inventory-service" "inventory-service" 8081 "/actuator/health"
register_http "admin-service" "admin-service" 8001 "/api/admin/health"
register_http "gateway" "gateway" 8080 "/health"

echo "Consul registration complete."
