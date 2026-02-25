FROM codercom/code-server:latest

USER root

# Install nginx, supervisor, and Node.js
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx supervisor curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
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

# Copy code-server settings
COPY code-server/settings.json /home/coder/.local/share/code-server/User/settings.json

# Copy demo workspace
COPY demo-workspace/ /home/coder/project/

# Fix ownership
RUN chown -R coder:coder /home/coder /app

# Install VS Code extensions
COPY code-server/extensions.txt /tmp/extensions.txt
RUN while IFS= read -r ext; do \
      [ -n "$ext" ] && su coder -c "code-server --install-extension $ext" || true; \
    done < /tmp/extensions.txt && rm /tmp/extensions.txt

EXPOSE 8080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/rex.conf"]
