ARG VARIANT=22-bookworm
FROM node:${VARIANT} AS build

ARG USERNAME=node
ARG NPM_GLOBAL=/usr/local/share/npm-global
ARG NODE_MODULES="tslint-to-eslint-config typescript xterm xterm-addon-fit xterm-addon-attach @xterm/addon-clipboard xterm-addon-serialize"
ARG PORT=4000

# Add NPM global to PATH.
ENV PATH=${NPM_GLOBAL}/bin:${PATH}

RUN \
    # Configure global npm install location, use group to adapt to UID/GID changes
    if ! cat /etc/group | grep -e "^npm:" > /dev/null 2>&1; then groupadd -r npm; fi \
    && usermod -a -G npm ${USERNAME} \
    && umask 0002 \
    && mkdir -p ${NPM_GLOBAL} \
    && touch /usr/local/etc/npmrc \
    && chown ${USERNAME}:npm ${NPM_GLOBAL} /usr/local/etc/npmrc \
    && chmod g+s ${NPM_GLOBAL} \
    && npm config -g set prefix ${NPM_GLOBAL} \
    && su ${USERNAME} -c "npm config -g set prefix ${NPM_GLOBAL}" \
    # Install eslint
    && su ${USERNAME} -c "umask 0002 && npm install -g eslint" \
    && npm cache clean --force > /dev/null 2>&1

RUN su node -c "umask 0002 && npm install -g ${NODE_MODULES}" \
    && npm cache clean --force > /dev/null 2>&1

ENV PORT=${PORT}

WORKDIR /home/node
COPY --chown=node:node . /home/node/

USER node
RUN npm install
# RUN npm run build

ENTRYPOINT []
CMD ["npx", "vite", "--port", "4000", "--host" ]


# FROM nginx

# COPY --from=build /home/node/dist /usr/share/nginx/html

# EXPOSE 80
# CMD ["nginx","-g","daemon off;"]