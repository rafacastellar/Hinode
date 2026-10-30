#!/usr/bin/env bash
# =============================================================================
# Judô Hinodê SaaS - Script de Implantação Automatizada na VMware (Ubuntu)
# Substitui o Apache Tomcat (porta 8080) pelo servidor Node.js (SvelteKit SSR)
# =============================================================================
set -euo pipefail

APP_DIR="/opt/hinode"
SERVICE_NAME="hinode"
PORT="8080"

echo "============================================================"
echo "🥋 Iniciando Implantação do SaaS Judô Hinodê na VM (Porta $PORT)"
echo "============================================================"

# 1. Parar e desativar o Apache Tomcat 10 para liberar a porta 8080
echo "[1/6] Verificando e desativando o Apache Tomcat na porta 8080..."
for svc in tomcat10 tomcat9 tomcat; do
    if systemctl list-unit-files | grep -q "^${svc}.service"; then
        echo " -> Parando e desabilitando ${svc}..."
        sudo systemctl stop "$svc" || true
        sudo systemctl disable "$svc" || true
    fi
done

# 2. Verificar/Instalar Node.js 22+ LTS (Requisito do SvelteKit 3: Node >= 22.17)
echo "[2/6] Verificando Node.js 22 LTS..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 22 ]; then
    echo " -> Instalando Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo " -> Node: $(node -v) | NPM: $(npm -v)"

# 3. Verificar banco de dados MySQL (hinode_db)
echo "[3/6] Verificando banco de dados MySQL (hinode_db)..."
sudo systemctl start mysql || true
sudo systemctl enable mysql || true

# Configura usuário/acesso para a aplicação no MySQL local da VM
sudo mysql -e "CREATE USER IF NOT EXISTS 'hinode_app'@'localhost' IDENTIFIED BY 'hinode_pass_2026';"
sudo mysql -e "GRANT ALL PRIVILEGES ON hinode_db.* TO 'hinode_app'@'localhost'; FLUSH PRIVILEGES;"

DB_EXISTS=$(sudo mysql -N -s -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='hinode_db';")
if [ -z "$DB_EXISTS" ]; then
    echo " -> Criando banco hinode_db a partir de conf/sql/Hinode_V4.sql..."
    sudo mysql < "$APP_DIR/conf/sql/Hinode_V4.sql"
else
    TABLE_COUNT=$(sudo mysql -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='hinode_db';")
    if [ "$TABLE_COUNT" -eq 0 ]; then
        echo " -> Banco hinode_db vazio. Importando conf/sql/Hinode_V4.sql..."
        sudo mysql < "$APP_DIR/conf/sql/Hinode_V4.sql"
    else
        echo " -> Banco hinode_db já possui $TABLE_COUNT tabelas."
    fi
fi

sudo mysql hinode_db -e "
CREATE TABLE IF NOT EXISTS Usuario_Academia_Perfil (
    id_usuario INT NOT NULL,
    id_academia INT NOT NULL,
    id_perfil INT NOT NULL,
    PRIMARY KEY (id_usuario, id_academia, id_perfil),
    FOREIGN KEY (id_usuario, id_academia) REFERENCES Usuario_Academia(id_usuario, id_academia) ON DELETE CASCADE,
    FOREIGN KEY (id_perfil) REFERENCES Perfil(id_perfil) ON DELETE CASCADE
);"

if [ -f "$APP_DIR/conf/sql/.dbeaver/seed.sql" ]; then
    echo " -> Aplicando dados iniciais (seed.sql)..."
    sudo mysql hinode_db < "$APP_DIR/conf/sql/.dbeaver/seed.sql"
fi

# 4. Configurar variáveis de ambiente (.env) e instalar dependências
echo "[4/6] Configurando .env e compilando aplicação SvelteKit..."
cd "$APP_DIR"

cat << 'EOF' > "$APP_DIR/.env"
DB_HOST=localhost
DB_PORT=3306
DB_USER=hinode_app
DB_PASSWORD=hinode_pass_2026
DB_NAME=hinode_db

SESSION_SECRET=hinode_vm_production_secret_key_32_chars_2026_impacta
HOST=0.0.0.0
PORT=8080
PROTOCOL_HEADER=x-forwarded-proto
HOST_HEADER=x-forwarded-host
STORAGE_DRIVER=local
EOF
chmod 600 "$APP_DIR/.env"

sudo chown -R saas:saas "$APP_DIR"
sudo -u saas npm install --engine-strict=false
sudo -u saas npm run build

# 5. Criar e ativar serviço Systemd (hinode.service) na porta 8080
echo "[5/6] Configurando serviço Systemd ($SERVICE_NAME.service) na porta $PORT..."
NPM_BIN=$(command -v npm)
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << EOF
[Unit]
Description=Judo Hinode SaaS - SvelteKit Node.js Server (Porta $PORT)
After=network.target mysql.service
Requires=mysql.service

[Service]
Type=simple
User=saas
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
Environment=NODE_ENV=production
Environment=HOST=0.0.0.0
Environment=PORT=$PORT
ExecStart=$NPM_BIN run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}.service
sudo systemctl restart ${SERVICE_NAME}.service

# 6. Liberar porta 8080 no UFW (se ativo)
echo "[6/6] Verificando firewall e status final..."
if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow ${PORT}/tcp
fi

sleep 3
sudo systemctl status ${SERVICE_NAME}.service --no-pager
echo "============================================================"
echo "✅ Hinodê rodando na porta $PORT!"
echo "🌐 Acesso no Windows: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "============================================================"