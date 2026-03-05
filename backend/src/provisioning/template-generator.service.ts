import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

export interface MatrixEnvConfig {
  slug: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  n8nUser: string;
  n8nPassword: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  corsOrigin: string;
  ports: {
    backend: number;
    frontend: number;
    db: number;
    redis: number;
    n8n: number;
    adminer: number;
  };
}

@Injectable()
export class TemplateGeneratorService {
  private readonly logger = new Logger(TemplateGeneratorService.name);

  constructor(private readonly config: ConfigService) { }

  /**
   * Generate a unique .env file for a new matrix instance.
   */
  generateEnvFile(envConfig: MatrixEnvConfig): string {
    return `# ============================================
# Matriz ${envConfig.slug} — Auto-Generated
# Generated at: ${new Date().toISOString()}
# ============================================

# Database
POSTGRES_DB=${envConfig.dbName}
POSTGRES_USER=${envConfig.dbUser}
POSTGRES_PASSWORD=${envConfig.dbPassword}

# n8n
N8N_USER=${envConfig.n8nUser}
N8N_PASSWORD=${envConfig.n8nPassword}

# Supabase Auth
SUPABASE_URL=${envConfig.supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${envConfig.supabaseServiceRoleKey}

# CORS
CORS_ORIGINS=${envConfig.corsOrigin}

# Security
ENCRYPTION_KEY=${randomBytes(32).toString('hex')}

# Tenant isolation
TENANT_ID=${envConfig.slug}


# Modules

ACTIVE_MODULES=


# Environment
NODE_ENV=production
`;
  }

  /**
   * Generate a docker-compose.yml for a specific matrix instance.
   * Uses unique ports and network name based on slug.
   */
  generateDockerCompose(envConfig: MatrixEnvConfig): string {
    const { slug, ports } = envConfig;
    const networkName = `matriz-${slug}-network`;

    return `version: '3.8'

# ============================================
# Matriz ${slug} — Docker Compose (Auto-Generated)
# ============================================

services:
  # ---- PostgreSQL + pgvector ----
  db:
    image: pgvector/pgvector:pg16
    container_name: matriz-${slug}-db
    restart: unless-stopped
    ports:
      - "127.0.0.1:${ports.db}:5432"
    environment:
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ${networkName}

  # ---- Redis ----
  redis:
    image: redis:7-alpine
    container_name: matriz-${slug}-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:${ports.redis}:6379"
    volumes:
      - redisdata:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ${networkName}

  # ---- Adminer (DB UI) ----
  adminer:
    image: adminer
    container_name: matriz-${slug}-adminer
    restart: unless-stopped
    ports:
      - "127.0.0.1:${ports.adminer}:8080"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - ${networkName}

  # ---- n8n (Automation) ----
  n8n:
    image: n8nio/n8n
    container_name: matriz-${slug}-n8n
    restart: unless-stopped
    ports:
      - "127.0.0.1:${ports.n8n}:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=\${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=\${N8N_PASSWORD}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=db
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=\${POSTGRES_DB}
      - DB_POSTGRESDB_USER=\${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=\${POSTGRES_PASSWORD}
      - GENERIC_TIMEZONE=Europe/Madrid
    volumes:
      - n8ndata:/home/node/.n8n
    depends_on:
      db:
        condition: service_healthy
    networks:
      - ${networkName}

  # ---- NestJS Backend ----
  backend:
    build: ./backend
    container_name: matriz-${slug}-backend
    restart: unless-stopped
    ports:
      - "127.0.0.1:${ports.backend}:3000"
    environment:
      - DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/\${POSTGRES_DB}?schema=app
      - ENCRYPTION_KEY=\${ENCRYPTION_KEY}
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
      - SUPABASE_URL=\${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=\${SUPABASE_SERVICE_ROLE_KEY}
      - CORS_ORIGINS=\${CORS_ORIGINS}
      - TENANT_ID=\${TENANT_ID}
      - ACTIVE_MODULES=\${ACTIVE_MODULES:-}
      - PANEL_API_URL=\${PANEL_API_URL:-}
      - PANEL_API_KEY=\${PANEL_API_KEY:-}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ${networkName}

  # ---- Angular Frontend ----
  frontend:
    build: ./frontend
    container_name: matriz-${slug}-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:${ports.frontend}:4200"
    depends_on:
      - backend
    networks:
      - ${networkName}

volumes:
  pgdata:
    name: matriz-${slug}-pgdata
  redisdata:
    name: matriz-${slug}-redisdata
  n8ndata:
    name: matriz-${slug}-n8ndata

networks:
  ${networkName}:
    name: ${networkName}
    driver: bridge
`;
  }

  /**
* Generate Nginx site config for a matrix subdomain (HTTP only).
* Certbot --nginx will add SSL automatically after this config is in place.
*/
  generateNginxConfig(subdomain: string, ports: { backend: number; frontend: number }): string {
    return `# Auto-generated for ${subdomain}
server {
listen 80;
server_name ${subdomain};

# Frontend
location / {
    proxy_pass http://127.0.0.1:${ports.frontend};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Backend API
location /api/ {
    proxy_pass http://127.0.0.1:${ports.backend};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
}
`;
  }
  /**
   * Calculate ports for a given slot index.
   * Slot 1: 3001, 4201, 5433, 6380, 5679, 8081
   * Slot 2: 3002, 4202, 5434, 6381, 5680, 8082
   * etc.
   */
  calculatePorts(slotIndex: number) {
    return {
      backend: 3000 + slotIndex,
      frontend: 4200 + slotIndex,
      db: 5432 + slotIndex,
      redis: 6379 + slotIndex,
      n8n: 5678 + slotIndex,
      adminer: 8080 + slotIndex,
    };
  }

  /**
   * Generate a secure random password.
   */
  generatePassword(length = 24): string {
    return randomBytes(length).toString('base64url').slice(0, length);
  }
}
