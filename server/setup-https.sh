#!/bin/bash
echo "=== 1. Limpando regras antigas do Iptables ==="
iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000 2>/dev/null
iptables-save > /etc/iptables.rules 2>/dev/null

echo "=== 2. Instalando o Nginx e Certbot (Cadeadinho Verde) ==="
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo "=== 3. Criando o arquivo de configuracao do Nginx ==="
# Criando a configuracao de redirecionamento para o nosso jogo
cat > /etc/nginx/sites-available/ghostgames << 'EOF'
server {
    listen 80;
    server_name ghostgames.club www.ghostgames.club;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "=== 4. Ativando o Nginx ==="
ln -s /etc/nginx/sites-available/ghostgames /etc/nginx/sites-enabled/ 2>/dev/null
rm /etc/nginx/sites-enabled/default 2>/dev/null
systemctl restart nginx

echo "=== 5. Gerando o Certificado HTTPS ==="
# O --redirect vai forcar todos a usarem o https:// automaticamente
certbot --nginx -d ghostgames.club -d www.ghostgames.club --non-interactive --agree-tos -m contato@ghostgames.club --redirect

echo "=== 6. Reiniciando os servicos finais ==="
systemctl restart nginx

echo ""
echo "==================================================="
echo "SUCESSO ABSOLUTO! O HTTPS FOI INSTALADO!"
echo "Teste o seu site em: https://ghostgames.club"
echo "==================================================="
