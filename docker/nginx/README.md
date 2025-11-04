# Nginx Configuration

mkdir -p ./docker/nginx/ssl

rm -f ./docker/nginx/ssl/fullchain.pem ./docker/nginx/ssl/privkey.pem

chmod +x scripts/generate-ssl.sh
sudo ./scripts/generate-ssl.sh socialforge.io

ls -l ./docker/nginx/ssl/

docker compose stop socialforge-certbot socialforge-certbot-init

docker compose --profile init-certs up --force-recreate --abort-on-container-exit
