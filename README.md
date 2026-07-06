# Educação Interativa Angola

Projecto educativo sobre economia e história de Angola, organizado em três partes principais:

- `frontend` - interface web principal
- `backend` - API e regras de negócio
- `mobile` - aplicação mobile
- `database` - ficheiros e recursos relacionados com a base de dados

## Estrutura

```text
Educação interativa Angola/
├─ frontend/
├─ backend/
├─ mobile/
├─ database/
└─ README.md
```

## Frontend

A pasta `frontend` contém a aplicação web existente, construída com React e Vite.

## Backend

A pasta `backend` já está preparada com uma estrutura inicial para:

- servidor
- rotas
- controllers
- middlewares
- configuração de ambiente

## Mobile

A pasta `mobile` contém a aplicação mobile (Expo / React Native + TypeScript),
integrada com a mesma API do backend: autenticação JWT, conteúdos, quizzes,
fórum e perfil. Ver [`mobile/README.md`](mobile/README.md) para instruções de
execução.

## Database

A pasta `database` pode ser usada para:

- scripts de criação da base de dados
- migrations
- seeds
- backups
- documentação da estrutura da base de dados

## Como começar

1. Arrancar o `backend` (API + base de dados). Ver `backend/README.md`.
2. Arrancar o `frontend` (interface web).
3. Arrancar o `mobile` apontando para a API do backend. Ver `mobile/README.md`.

## Notas

- As quatro camadas (`frontend`, `backend`, `mobile`, `database`) estão
  funcionais e partilham a mesma API REST.
