# Backend — Educação Interativa Angola

API REST em **TypeScript + Express + MySQL** com autenticação JWT e recuperação de senha via email.

## Funcionalidades implementadas

- Registo e login de utilizadores (JWT)
- Perfil de utilizador
- **Recuperação de senha completa** (forgot-password + reset-password + envio de email)
- Rate limiting nos endpoints sensíveis
- Fórum, conteúdos, quizzes, notificações, progressos
- Painel de administração

## Estrutura

```text
backend/
├─ src/                         ← código-fonte TypeScript
│  ├─ app.ts
│  ├─ server.ts
│  ├─ config/
│  │  ├─ database.ts
│  │  ├─ env.ts
│  │  └─ jwt.ts
│  ├─ controllers/
│  │  ├─ auth.controller.ts     ← login, registo, forgot/reset-password
│  │  └─ ...
│  ├─ services/
│  │  ├─ email.service.ts       ← envio SMTP + log local
│  │  └─ password-reset.service.ts  ← tokens JWT de reset
│  ├─ routes/
│  │  └─ auth.routes.ts         ← POST /forgot-password, /reset-password
│  └─ middlewares/
│     └─ rateLimit.ts           ← limita pedidos por IP
├─ dist/                        ← JS compilado (gerado por `npm run build`)
├─ .env.exemplo                 ← variáveis de ambiente necessárias
├─ .env.desenvolvimento         ← configuração local de desenvolvimento
└─ .env.final                   ← configuração de produção local
```

## Configuração rápida

### 1. Base de dados

```bash
mysql -u root -p < ../database/schema.sql
mysql -u root -p < ../database/seeds.sql
# Se estiver a migrar de uma versão antiga:
mysql -u root -p < ../database/migrations/001_password_resets_table.sql
```

### 2. Variáveis de ambiente

Copia `.env.exemplo` para `.env` e preenche:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=economia_historia

JWT_SECRET=string-longa-e-aleatoria
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# SMTP Gmail (usa App Password — não a senha normal)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=teu-email@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM="Educação Interativa Angola <teu-email@gmail.com>"
```

> **Sem SMTP configurado:** o backend funciona na mesma. O link de reset fica gravado em `backend/logs/emails.log` para uso local.

### 3. Instalar e correr

```bash
npm install
npm run dev        # desenvolvimento (tsx watch + .env.desenvolvimento)
npm run build      # compila TypeScript → dist/
npm run serve      # produção (node dist/ + .env.final)
```

## Endpoints de recuperação de senha

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/forgot-password` | Envia email com link de reset (max 5 pedidos/15min por IP) |
| `POST` | `/api/auth/reset-password` | Define nova senha com token válido (max 10 tentativas/15min) |

### Exemplo

```json
// POST /api/auth/forgot-password
{ "email": "utilizador@exemplo.com" }

// POST /api/auth/reset-password
{ "token": "abc123...", "password": "novaSenha123" }
```

O token expira em **1 hora**. Cada pedido de recuperação invalida o token anterior.

## Fluxo completo de recuperação de senha

```
Utilizador → /recuperar-senha (frontend)
  └─ POST /api/auth/forgot-password
       └─ Cria token em tabela `password_resets`
       └─ Envia email com link: /redefinir-senha?token=...
            └─ Em dev sem SMTP: link gravado em logs/emails.log

Utilizador clica no link → /redefinir-senha?token=... (frontend)
  └─ POST /api/auth/reset-password
       └─ Valida token (não expirado, não usado)
       └─ Actualiza senha na BD
       └─ Marca token como usado + limpa todos os tokens do utilizador
       └─ Redireciona para /login em 5 segundos
```
