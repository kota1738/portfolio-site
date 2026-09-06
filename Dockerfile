FROM nginx:alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY index.html 404.html style.css script.js robots.txt sitemap.xml /usr/share/nginx/html/
