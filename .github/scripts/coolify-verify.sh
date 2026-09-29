#!/usr/bin/env bash
#
# Polls a Coolify deployment until it reaches a terminal state.
#
# This is the migration guard. Coolify's post-deployment command (`bun run db:migrate`)
# does NOT fail the deployment when it fails, so this is the only thing standing between a
# failed migration and a green run. A deploy whose migration outcome is unknown is treated
# as a failure, never as a success.
#
# Required environment:
#   COOLIFY_BASE_URL  e.g. https://coolify.example.com
#   COOLIFY_TOKEN     a Coolify API token with the `read` ability
#   DEPLOYMENT_UUID   the UUID returned by coolify-deploy.sh
# Optional:
#   COOLIFY_TIMEOUT_SECONDS  how long to wait before giving up (default 900)

set -euo pipefail

for name in COOLIFY_BASE_URL COOLIFY_TOKEN DEPLOYMENT_UUID; do
    if [ -z "${!name:-}" ]; then
        echo "::error title=Missing Coolify secret::${name} is not set."
        exit 1
    fi
done

status_file="$(mktemp)"
readonly status_file
trap 'rm -f "${status_file}"' EXIT

readonly timeout_seconds="${COOLIFY_TIMEOUT_SECONDS:-900}"
readonly deadline=$(( SECONDS + timeout_seconds ))
readonly poll_seconds=15

while :; do
    http_code="$(curl --silent --show-error --connect-timeout 10 --max-time 30 \
        --output "${status_file}" --write-out '%{http_code}' \
        --header "Authorization: Bearer ${COOLIFY_TOKEN}" \
        "${COOLIFY_BASE_URL}/api/v1/deployments/${DEPLOYMENT_UUID}" || true)"

    case "${http_code:-000}" in
        200) ;;
        401 | 403)
            echo "::error title=Deployment unverified::The Coolify API token cannot read deployment status (HTTP ${http_code}), so the post-deployment migration outcome is unknown. Give the token the \`read\` ability; failing rather than reporting an unverified green deploy."
            exit 1
            ;;
        404)
            echo "::error title=Deployment unverified::Coolify has no deployment ${DEPLOYMENT_UUID} (HTTP 404). Not retrying: a missing deployment cannot become valid."
            exit 1
            ;;
        *)
            echo "Coolify status request answered HTTP ${http_code:-no response}; retrying in ${poll_seconds}s."
            sleep "${poll_seconds}"
            continue
            ;;
    esac

    status="$(jq --raw-output '.status // empty' "${status_file}")"
    echo "Coolify deployment ${DEPLOYMENT_UUID}: ${status:-unknown}"

    case "${status}" in
        finished | success)
            exit 0
            ;;
        failed | cancelled | canceled)
            echo "::error title=Deployment failed::Coolify deployment ${DEPLOYMENT_UUID} ended as '${status}'; its post-deployment migration may have failed. Check the Coolify deployment log."
            exit 1
            ;;
    esac

    if [ "${SECONDS}" -ge "${deadline}" ]; then
        echo "::error title=Deployment unverified::Coolify deployment ${DEPLOYMENT_UUID} was still '${status:-unknown}' after ${timeout_seconds}s."
        exit 1
    fi

    sleep "${poll_seconds}"
done
