FROM dockerproxy.repos.tech.orange/nginx:1.25.5-alpine3.19-slim

LABEL name="application-tools-frontend" \
      maintainer="girija.saint-ange@orange.com" \
      description="Orange Expertise Management Application frontend" \
      url="https://gitlab.tech.orange/oesw/oema/frontend"

ARG UID=1004210001
ARG GID=1004210001

COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/default.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html
COPY ./dist/oema-frontend .

HEALTHCHECK  --interval=15s --timeout=3s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:4200/ || exit 1

EXPOSE 8080 8443

USER $UID
