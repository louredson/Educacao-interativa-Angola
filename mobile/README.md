# Mobile (Expo / React Native)

App mobile do projecto, com paridade funcional com as funcionalidades principais da web.
Consome a mesma API REST do backend.

> **Expo SDK 56** (React Native 0.85, React 19) — compatível com a app **Expo Go 56**.

## Funcionalidades

- **Autenticação** — login e registo (JWT guardado em AsyncStorage).
- **Navegação** — tabs (Início, Explorar, Debate, Quizzes, Perfil) + stack para detalhes.
- **Início** — estatísticas reais da plataforma (`/api/stats`).
- **Explorar** — biblioteca de conteúdos (`/api/content`) com gosto e guardar.
- **Debate (Fórum)** — lista de tópicos (`/api/topicos`), gosto (+1), criar tópico,
  ver detalhe e responder.
- **Quizzes** — lista de quizzes e ranking (`/api/quizzes`, `/api/ranking`); responder
  a um quiz e ver a pontuação (`/api/quizzes/:id`, `/api/quizzes/:id/attempt`).
- **Perfil** — dados e estatísticas do utilizador (`/api/perfil`) e terminar sessão.
- **Notificações** — lista e marcação como lida (`/api/notificacoes`).

## Estrutura

- `App.tsx` — providers (SafeArea, Auth, Navigation)
- `src/contexts/AuthContext.tsx` — sessão e token
- `src/navigation` — navegação principal
- `src/screens` — ecrãs
- `src/services/api.ts` — cliente HTTP (fetch + token)
- `src/theme` — cores

## Configuração da API

Por defeito aponta para `http://localhost:5000/api`. Define `EXPO_PUBLIC_API_URL`
para o teu backend. No **emulador Android** usa `http://10.0.2.2:5000/api`.

## Como correr

```bash
npm install
npm start        # Expo (escolhe Android/iOS/web)
npm run android  # emulador/dispositivo Android
npm run typecheck
```
