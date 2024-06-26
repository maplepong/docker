FROM python:3.12.3

# 패키지 종속성 설치
COPY ./django /app/

WORKDIR /app

# RUN apt-get -y install openssl
RUN pip install -r requirements.txt
# RUN openssl genrsa -out /etc/ssl/private/my_key.key 2048
# RUN openssl req -x509 -nodes -days 365 -key /etc/ssl/private/my_key.key -out /etc/ssl/private/my_certificate.crt -subj "/C=KR/ST=SEOUL/L=Gaepodong/O=42Seoul/OU=wonljeon/CN=localhost"

# RUN chmod 700 /etc/ssl/private/my_key.key
# RUN chmod 700 /etc/ssl/private/my_certificate.crt

# .env 파일 복사 및 환경변수 로드
ENV $(cat .env | xargs)

# DJANG_SETTING_MODULE 환경 변수 설정
ENV DJANGO_SETTINGS_MODULE=maran.settings

WORKDIR /app/maran

# 엔트리포인트 스크립트 복사 및 실행 권한 부여
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# 엔트리포인트 설정
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "maran.asgi:application"]
# CMD ["daphne", "-e", "ssl:8000:privateKey=/etc/ssl/private/my_key.key:certKey=/etc/ssl/private/my_certificate.crt", "maran.asgi:application"]


