#!/bin/bash
# Connect the CI job's own container to a docker network so compose services
# resolve by name. The job runs inside a container of the shared host daemon,
# but $(hostname) is NOT its container name on this runner — recover the real
# container id from the kernel's view, with fallbacks.
#
# Usage: connect-network.sh <network-name> [connect|disconnect]
#
# Teardown must disconnect before `docker compose down`: Docker refuses to
# remove a network that still has this job attached, so it leaked one per run.
set -euo pipefail

NETWORK=${1:?usage: connect-network.sh <network-name> [connect|disconnect]}
ACTION=${2:-connect}
case "$ACTION" in connect|disconnect) ;; *) echo "❌ unknown action: $ACTION" >&2; exit 1 ;; esac

# 1. The container id appears in bind-mount sources like
#    /var/lib/docker/containers/<id>/{hostname,resolv.conf}
CID=$(grep -oE 'containers/[0-9a-f]{64}' /proc/self/mountinfo | head -1 | cut -d/ -f2 || true)

# 2. cgroup v1 paths carry docker/<id>
if [ -z "$CID" ]; then
  CID=$(grep -oE 'docker[/-][0-9a-f]{64}' /proc/self/cgroup | head -1 | grep -oE '[0-9a-f]{64}' || true)
fi

# 3. Last resort: the runner names containers with the hostname as prefix
if [ -z "$CID" ]; then
  CID=$(docker ps -q --filter "name=$(hostname)" | head -1)
fi

if [ -z "$CID" ]; then
  echo "❌ Could not determine this job's container id" >&2
  exit 1
fi

echo "docker network $ACTION $NETWORK $CID"
docker network "$ACTION" "$NETWORK" "$CID"
