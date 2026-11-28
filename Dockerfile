# === Build stage ===
FROM node:26-bookworm-slim AS build

# VITE_* vars are statically replaced by Vite at build time (import.meta.env.*)
# Defaults here are production values — CI can override via --build-arg if needed
ARG VITE_API_URL="api-ocf.labinux.net"
ARG VITE_PROTOCOL="https"
ARG VITE_FEATURE_COURSES_ENABLED="true"
ARG VITE_FEATURE_LABS_ENABLED="true"
ARG VITE_FEATURE_TERMINALS_ENABLED="true"
# Where the machines that run in learners' browsers get their disk image (an
# erofs file, served with Range support). Empty means
# /local-machine/debian.erofs on the front's own origin, which this image
# does not hold.
# Must match the image local-machine-image's CI publishes (runbook): its name carries its sha256.
ARG VITE_LOCAL_MACHINE_DISTRO_URL="https://ocf-local-machine-prod.s3.fr-par.scw.cloud/local-machine/debian-labs-10f92ee85980ace6.erofs"
# The Debian mirror of those machines, on its own hostname (nginx/start.sh,
# LOCAL_MACHINE_MIRROR_HOST below): an origin, no path. Empty means the
# front's own origin.
ARG VITE_LOCAL_MACHINE_MIRROR_URL="https://apt.labinux.com"

WORKDIR /app
COPY package.json package-lock.json ./
# Download cache mount: only speeds up installs, works when empty
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .

RUN npm run build

# === Runtime stage ===
FROM nginx:1.31-alpine

# Runtime configuration, rendered into nginx's config at container start
# (nginx/start.sh says what each variable does).
ENV INCUS_PROXY_TARGET="http://ocf:8080"
ENV LOCAL_MACHINE_MIRROR_HOST="apt.labinux.com"
ENV LOCAL_MACHINE_APP_ORIGINS="https://app.labinux.com https://ocf.labinux.com"

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf
COPY nginx/local-machine-mirror.locations nginx/local-machine-mirror-host.conf /etc/nginx/templates/
COPY --chmod=755 nginx/start.sh /usr/local/bin/ocf-front-nginx

EXPOSE 80

CMD ["/usr/local/bin/ocf-front-nginx"]
