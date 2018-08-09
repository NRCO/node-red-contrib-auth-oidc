#########################################
# Node-RED server with OpenID Auth plugin
##########################################

FROM node:8-onbuild

RUN npm install -g --unsafe-perm node-red && \
    mkdir ~/.node-red && \
    npm link

RUN cd ~/.node-red && npm link node-red-contrib-auth-oidc

# Ports
EXPOSE 1880

ENTRYPOINT ["node-red"]

