#!/bin/bash
# Remove every compose stack left on the shared host Docker daemon by earlier
# e2e jobs whose after_script never ran (cancelled, timed out, runner crash):
# containers with their anonymous volumes, networks, named volumes, images.
#
# Safe only because both e2e jobs share `resource_group: e2e-stack`: while one
# runs, no other job owns an object carrying the prefix. Run it BEFORE `up`.
#
# Usage: reap-stale-stacks.sh <project-prefix>
set -uo pipefail

PREFIX=${1:?usage: reap-stale-stacks.sh <project-prefix>}

docker ps -a --format '{{.ID}} {{.Label "com.docker.compose.project"}}' \
  | awk -v p="$PREFIX" 'index($2, p) == 1 { print $1 }' \
  | xargs -r docker rm -f -v
docker network ls --format '{{.Name}}' | grep "^${PREFIX}" | xargs -r docker network rm
docker volume ls --format '{{.Name}}' | grep "^${PREFIX}" | xargs -r docker volume rm
docker images --format '{{.Repository}}:{{.Tag}}' | grep "^${PREFIX}" | xargs -r docker rmi -f

# Never fail the job: a leftover we cannot remove is not this job's problem.
exit 0
