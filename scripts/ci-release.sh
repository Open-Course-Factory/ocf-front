#!/usr/bin/env bash
# Commits a release version bump straight to main, from a main pipeline whose
# tests passed. That commit's own pipeline builds the image and check-version
# tags it. Usage: ci-release.sh patch|minor
set -euo pipefail

level="$1"

git fetch --quiet origin main
# Releasing from an older pipeline would ship commits it never tested.
if [ "$(git rev-parse origin/main)" != "$CI_COMMIT_SHA" ]; then
  echo "main moved since this pipeline ran: release from the newest main pipeline." >&2
  exit 1
fi

# npm rewrites package.json and both root version fields of the lockfile;
# VERSION must change in the same commit.
npm version "$level" --no-git-tag-version --ignore-scripts
version=$(node -p "require('./package.json').version")
echo "$version" > VERSION

git config user.name "GitLab CI"
git config user.email "ci@gitlab.local"
git commit -m "chore: release $version" -- VERSION package.json package-lock.json
git push "https://gitlab-ci-token:${CI_PUSH_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git" "HEAD:refs/heads/main"
echo "Released $version: its main pipeline builds and tags it."
