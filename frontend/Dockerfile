
FROM nginx:alpine

ARG NGINX_CONFIG=nginx.k8s.conf

COPY index.html /usr/share/nginx/html/index.html
COPY ${NGINX_CONFIG} /etc/nginx/conf.d/default.conf

EXPOSE 80