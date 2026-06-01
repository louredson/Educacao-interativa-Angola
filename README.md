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

A pasta `mobile` já tem uma base inicial para uma app Expo / React Native.

## Database

A pasta `database` pode ser usada para:

- scripts de criação da base de dados
- migrations
- seeds
- backups
- documentação da estrutura da base de dados

## Como começar

1. Trabalhar primeiro no `frontend`, porque já está funcional.
2. Expandir o `backend` com autenticação, conteúdos e fórum.
3. Evoluir o `mobile` usando a mesma API do backend.
4. Organizar a `database` conforme o ORM ou motor que escolheres.

## Notas

- O backend e o mobile foram criados como base inicial.
- Se quiseres, a seguir posso colocar a pasta `database` dentro de `backend` para ficar tudo mais limpo.
