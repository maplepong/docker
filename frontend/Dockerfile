# Use the official Nginx image as the base image
FROM nginx:latest

# Install OpenSSL
RUN apt-get -y update && \
    apt-get -y upgrade && \
    apt-get -y install openssl

# Create the directory for the static files
RUN mkdir /html

# Copy the static files
COPY ./dist /html
COPY ./conf/default.conf /etc/nginx/conf.d/default.conf

# Generate SSL certificates
RUN openssl genrsa -out /etc/ssl/private/my_key.key 2048
RUN openssl req -x509 -nodes -days 365 -key /etc/ssl/private/my_key.key -out /etc/ssl/private/my_certificate.crt -subj "/C=KR/ST=SEOUL/L=Gaepodong/O=42Seoul/OU=wonljeon/CN=localhost"

# Set permissions
RUN chmod 700 /etc/ssl/private/my_key.key
RUN chmod 700 /etc/ssl/private/my_certificate.crt

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
