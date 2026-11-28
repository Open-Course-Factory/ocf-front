#!/bin/sh
# Renders the nginx config from its templates, then runs nginx.
#
# INCUS_PROXY_TARGET           ocf-core, for the Incus UI proxy and the mirror's access check.
# LOCAL_MACHINE_MIRROR_HOST    the Debian mirror's own hostname (e.g. apt.labinux.com); the app's
#                              host then serves no mirror. Empty: the app's host serves it.
# LOCAL_MACHINE_APP_ORIGINS    the app's origins, space-separated, allowed to ask the mirror
#                              host (e.g. "https://app.labinux.com https://ocf.labinux.com").
set -eu

: "${LOCAL_MACHINE_MIRROR_HOST:=}"
: "${LOCAL_MACHINE_APP_ORIGINS:=}"

# The pod's DNS servers, for names nginx resolves per request (IPv6 servers go in brackets).
NGINX_LOCAL_RESOLVERS=$(awk '$1 == "nameserver" { printf "%s ", ($2 ~ /:/) ? "[" $2 "]" : $2 }' /etc/resolv.conf)
# One map entry per allowed origin (nginx.conf, $lm_cors_origin).
LOCAL_MACHINE_CORS_ORIGINS=$(for origin in $LOCAL_MACHINE_APP_ORIGINS; do printf '"%s" $http_origin; ' "$origin"; done)
export INCUS_PROXY_TARGET NGINX_LOCAL_RESOLVERS LOCAL_MACHINE_MIRROR_HOST LOCAL_MACHINE_CORS_ORIGINS

# Only our variables: envsubst would otherwise blank nginx's own ($uri, $host...).
render() {
    envsubst '${INCUS_PROXY_TARGET} ${NGINX_LOCAL_RESOLVERS} ${LOCAL_MACHINE_MIRROR_HOST} ${LOCAL_MACHINE_CORS_ORIGINS}' < "/etc/nginx/templates/$1" > "$2"
}

render default.conf /etc/nginx/conf.d/default.conf
render local-machine-mirror.locations /etc/nginx/local-machine-mirror.locations
if [ -n "$LOCAL_MACHINE_MIRROR_HOST" ]; then
    render local-machine-mirror-host.conf /etc/nginx/conf.d/local-machine-mirror.conf
    : > /etc/nginx/local-machine-mirror.app-host
else
    echo 'include /etc/nginx/local-machine-mirror.locations;' > /etc/nginx/local-machine-mirror.app-host
fi

exec nginx -g 'daemon off;'
