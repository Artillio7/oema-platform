FROM dockerproxy-iva.si.francetelecom.fr/mongo:3.4
LABEL maintainer="oswe alexis.lacroix@orange.com" \
      description="expert-management database load" \
      repository="https://gitlab.forge.orange-labs.fr/oswe/expert-management"

# Create a directory where our app will be placed
RUN mkdir -p /oema

# Copy any files
COPY loadJs.sh /oema
COPY *.js /oema/

RUN chown -R mongodb:root /oema

USER mongodb

CMD ["/oema/loadJs.sh"]

