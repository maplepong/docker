FROM nginx:latest

RUN apt-get -y update && \
    apt-get -y upgrade && \
    apt-get -y install openssl

RUN mkdir /html

COPY ./dist /html
COPY ./public /public
COPY ./conf/default.conf /etc/nginx/conf.d/default.conf

RUN openssl genrsa -out /etc/ssl/private/my_key.key 2048
RUN openssl req -x509 -nodes -days 365 -key /etc/ssl/private/my_key.key -out /etc/ssl/private/my_certificate.crt -subj "/C=KR/ST=SEOUL/L=Gaepodong/O=42Seoul/OU=wonljeon/CN=localhost"

RUN chmod 700 /etc/ssl/private/my_key.key
RUN chmod 700 /etc/ssl/private/my_certificate.crt

CMD ["nginx", "-g", "daemon off;"]