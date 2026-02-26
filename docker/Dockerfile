FROM node:20-slim

# Install nginx and supervisor
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx supervisor && \
    rm -rf /var/lib/apt/lists/*

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy supervisor config
COPY docker/supervisord.conf /etc/supervisor/conf.d/rex.conf

# Copy backend
COPY backend/ /app/backend/
WORKDIR /app/backend
RUN npm ci --production

# Copy presentation
COPY presentation/ /var/www/presentation/

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/rex.conf"]
