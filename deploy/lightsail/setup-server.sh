#!/usr/bin/env bash
# Lightsail 인스턴스 momong-prod-api (Ubuntu 24.04) 처음 한 번만 실행한다.
#   Docker · Docker Compose, PostgreSQL 18 클라이언트(DB 복원 · 백업용, 17 서버에도 접속된다), 스왑 2GB, ~/momong 폴더
# 사용: 서버에 접속해서  bash setup-server.sh
set -euo pipefail

echo "== 패키지 업데이트"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "== Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"

echo "== PostgreSQL 18 클라이언트 (운영 DB 가 18 이면 pg_dump 도 18 이상이어야 한다. 17.6 덤프도 읽는다)"
sudo apt-get install -y curl ca-certificates postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
sudo apt-get install -y postgresql-client-18
psql --version

echo "== 스왑 2GB (1GB 인스턴스 메모리 여유)"
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "== 작업 폴더"
mkdir -p ~/momong

echo
echo "완료. Docker 권한을 적용하려면 한 번 나갔다가 다시 접속한다."
