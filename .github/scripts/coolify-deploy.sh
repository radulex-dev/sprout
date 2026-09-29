#!/usr/bin/env bash
#
# Queues a Coolify deployment and prints the deployment UUID.
#
# Required environment:
#   COOLIFY_BASE_URL  e.g. https://coolify.example.com
#   COOLIFY_TOKEN     a Coolify API token with the `deploy` ability
#   COOLIFY_APP_UUID  the application's UUID in Coolify
#
# The UUID is written to $GITHUB_OUTPUT as `deployment_uuid` when that variable is
# set (i.e. under Actions) and to stdout otherwise, so the script is runnable by
# hand.

set -euo pipefail

for name in COOLIFY_BASE_URL COOLIFY_TOKEN COOLIFY_APP_UUID; do
    if [ -z "${!name:-}" ]; then
        echo "::error title=Missing Coolify secret::${name} is not set."
        exit 1
    fi
done

# POST, not GET: Coolify answers a GET with 405 "This endpoint has changed to a POST
# request." Verified against the running instance.
response_file="$(mktemp)"
readonly response_file
trap 'rm -f "${response_file}"' EXIT

http_code="$(curl --silent --show-error --connect-timeout 10 --max-time 30 \
    --output "${response_file}" --write-out '%{http_code}' \
    --request POST \
    --header "Authorization: Bearer ${COOLIFY_TOKEN}" \
    "${COOLIFY_BASE_URL}/api/v1/deploy?uuid=${COOLIFY_APP_UUID}" || true)"

if [ "${http_code:-000}" != '200' ]; then
    echo "::error title=Coolify deploy request failed::POST /api/v1/deploy answered HTTP ${http_code:-no response}."
    cat "${response_file}"
    exit 1
fi

deployment_uuid="$(jq --raw-output '.deployments[0].deployment_uuid // empty' "${response_file}")"
if [ -z "${deployment_uuid}" ]; then
    echo "::error title=Coolify deploy request failed::The response contained no deployment UUID."
    cat "${response_file}"
    exit 1
fi

echo "deployment_uuid=${deployment_uuid}" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "Queued Coolify deployment ${deployment_uuid} for ${CI_PASSED_SHA:-the current commit}."
