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
ARG VITE_LOCAL_MACHINE_DISTRO_URL=""

WORKDIR /app
COPY package.json package-lock.json ./
# Download cache mount: only speeds up installs, works when empty
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .

RUN npm run build
# nginx.conf's CSP for the desktop page: the hashes of its inline code and
# the image's origin.
RUN node scripts/desktop-csp.mjs > desktop-csp.conf

# === Runtime stage ===
FROM nginx:1.31-alpine

# Runtime-configurable proxy target for Incus UI
# (envsubst replaces ${INCUS_PROXY_TARGET} in nginx config at container startup)
ENV INCUS_PROXY_TARGET="http://ocf:8080"

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/desktop-csp.conf /etc/nginx/desktop-csp.conf

EXPOSE 80

# Scope envsubst to ONLY our variables — otherwise it corrupts nginx builtins ($uri, $host, etc.)
# NGINX_LOCAL_RESOLVERS: the pod's DNS servers, for names nginx resolves per
# request (IPv6 servers go in brackets).
CMD ["/bin/sh", "-c", "export NGINX_LOCAL_RESOLVERS=$(awk '$1 == \"nameserver\" { printf \"%s \", ($2 ~ /:/) ? \"[\" $2 \"]\" : $2 }' /etc/resolv.conf) && envsubst '${INCUS_PROXY_TARGET} ${NGINX_LOCAL_RESOLVERS}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
