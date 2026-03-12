# === Build stage ===
FROM node:22-bookworm-slim AS build

# VITE_* vars are statically replaced by Vite at build time (import.meta.env.*)
# Defaults here are production values — CI can override via --build-arg if needed
ARG VITE_API_URL="api.solution-libre.fr"
ARG VITE_PROTOCOL="https"
ARG VITE_FEATURE_COURSES_ENABLED="true"
ARG VITE_FEATURE_LABS_ENABLED="true"
ARG VITE_FEATURE_TERMINALS_ENABLED="true"

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

RUN npm run build

# === Runtime stage ===
FROM nginx:1.27-alpine

# Runtime-configurable proxy target for Incus UI
# (envsubst replaces ${INCUS_PROXY_TARGET} in nginx config at container startup)
ENV INCUS_PROXY_TARGET="http://ocf:8080"

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# Scope envsubst to ONLY our variable — otherwise it corrupts nginx builtins ($uri, $host, etc.)
CMD ["/bin/sh", "-c", "envsubst '${INCUS_PROXY_TARGET}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
