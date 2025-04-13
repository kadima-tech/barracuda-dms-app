FROM nginx:mainline-alpine

# remove any existing configs
RUN rm /etc/nginx/conf.d/*

COPY nginx/. /etc/nginx/templates/.
COPY .next /var/www

ENV PORT 8080
ENV HOST 0.0.0.0

