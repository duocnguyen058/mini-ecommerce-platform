#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOOT_VERSION="${BOOT_VERSION:-4.1.0}"

generate_service() {
  local artifact_id="$1"
  local package_name="$2"
  local dependencies="$3"
  local target_dir="${ROOT_DIR}/services/${artifact_id}"
  local archive

  if [[ -f "${target_dir}/pom.xml" ]]; then
    printf 'Skip %s: pom.xml already exists.\n' "${artifact_id}"
    return
  fi

  if [[ -d "${target_dir}" ]] && [[ -n "$(find "${target_dir}" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
    printf 'Error: %s exists and is not empty.\n' "${target_dir}" >&2
    return 1
  fi

  archive="$(mktemp "${TMPDIR:-/tmp}/${artifact_id}.XXXXXX.zip")"

  printf 'Generating %s...\n' "${artifact_id}"
  curl -fsSLG https://start.spring.io/starter.zip \
    --data-urlencode type=maven-project \
    --data-urlencode language=java \
    --data-urlencode "bootVersion=${BOOT_VERSION}" \
    --data-urlencode javaVersion=21 \
    --data-urlencode groupId=com.miniecommerce \
    --data-urlencode "artifactId=${artifact_id}" \
    --data-urlencode "name=${artifact_id}" \
    --data-urlencode "packageName=${package_name}" \
    --data-urlencode "dependencies=${dependencies}" \
    -o "${archive}"

  mkdir -p "${target_dir}"
  unzip -q "${archive}" -d "${target_dir}"
  rm -f "${archive}"
}

mkdir -p \
  "${ROOT_DIR}/services" \
  "${ROOT_DIR}/infrastructure/postgres/init" \
  "${ROOT_DIR}/infrastructure/rabbitmq" \
  "${ROOT_DIR}/infrastructure/monitoring/prometheus" \
  "${ROOT_DIR}/infrastructure/monitoring/grafana" \
  "${ROOT_DIR}/frontend"

generate_service \
  api-gateway \
  com.miniecommerce.gateway \
  cloud-gateway-reactive,security,oauth2-resource-server,actuator,prometheus

generate_service \
  identity-service \
  com.miniecommerce.identity \
  web,validation,security,oauth2-authorization-server,data-jpa,postgresql,flyway,actuator,testcontainers

generate_service \
  catalog-service \
  com.miniecommerce.catalog \
  web,validation,data-jpa,postgresql,flyway,oauth2-resource-server,actuator,testcontainers

generate_service \
  inventory-service \
  com.miniecommerce.inventory \
  web,validation,data-jpa,postgresql,flyway,oauth2-resource-server,amqp,actuator,testcontainers

generate_service \
  cart-service \
  com.miniecommerce.cart \
  web,validation,data-redis,oauth2-resource-server,actuator,testcontainers

generate_service \
  order-service \
  com.miniecommerce.order \
  web,validation,data-jpa,postgresql,flyway,oauth2-resource-server,amqp,actuator,testcontainers

printf '\nGenerated services:\n'
find "${ROOT_DIR}/services" -mindepth 2 -maxdepth 2 -name pom.xml -print | sort

printf '\nNext step: configure compose.yml, then implement catalog-service first.\n'
