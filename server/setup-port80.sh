#!/bin/bash
echo "=== Parando servidores velhos na porta 80 ==="
systemctl stop nginx 2>/dev/null && echo "Nginx parado!" || echo "Nginx nao encontrado, ok."
systemctl disable nginx 2>/dev/null
systemctl stop apache2 2>/dev/null
systemctl stop httpd 2>/dev/null
systemctl stop caddy 2>/dev/null

# Kill anything else on port 80
fuser -k 80/tcp 2>/dev/null && echo "Processo na porta 80 eliminado!" || echo "Porta 80 ja livre."

echo "=== Configurando redirecionamento porta 80 -> 3000 ==="
iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000 2>/dev/null
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
echo "Redirecionamento ativado!"

echo "=== Salvando regras para sobreviver a reinicializacao ==="
iptables-save > /etc/iptables.rules 2>/dev/null

echo ""
echo "SUCESSO! Porta 80 agora redireciona para porta 3000!"
echo "Teste acessando: http://ghostgames.club"
