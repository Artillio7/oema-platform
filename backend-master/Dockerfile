FROM docker-proxy-asis-ghcr.repos.tech.orange/puppeteer/puppeteer:22.12.1

LABEL name="application-tools-backend" \
      description="expert-management backend" \
      maintainer="girija.saint-ange@orange.com" \
      url="https://gitlab.tech.orange/oswe/application-tools/application-tools-backend"

# Change directory so that our commands run inside this new directory
WORKDIR /home/nodeapp/src/

# Copy any files at /
COPY . /home/nodeapp/src/

# Install dependencies
# Set node owner to create `.cache` directory for puppeteer
USER root
RUN chown -R node /home/nodeapp/src && \
    npm ci

# Expose application port
EXPOSE 4040
USER node
# Add HEALTHCHECK
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
CMD curl -f http://127.0.0.1:4040/api/ || exit 1

# Serve the app
ENTRYPOINT ["/bin/sh"]
CMD [ "-c", "node index.js"]
