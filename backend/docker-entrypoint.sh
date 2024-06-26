#!/bin/bash

# 작업 디렉토리를 manage.py가 있는 디렉토리로 변경
cd /app/maran

# 마이그레이션 명령어 실행
python manage.py makemigrations user
python manage.py makemigrations game
python manage.py makemigrations chat
python manage.py migrate

# 전달된 명령어 실행
exec "$@"
