FROM nginx:alpine
# Replace default nginx html with our static editor
RUN rm -rf /usr/share/nginx/html/*
COPY index.html styles.css app.js README.md /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# Coolify monitors externally via Traefik; no in-container healthcheck needed.
