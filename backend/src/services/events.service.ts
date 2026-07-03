import { EventEmitter } from 'node:events'

// Eventos de domínio suportados pelo sistema
export type AppEventMap = {
  'conteudo:criado':    [{ conteudoId: string; titulo: string; autorId: number }]
  'conteudo:apagado':   [{ conteudoId: string; autorId: number }]
  'topico:criado':      [{ topicoId: number; titulo: string; autorId: number }]
  'topico:respondido':  [{ topicoId: number; respostaId: number; autorId: number }]
  'sala:mensagem':      [{ salaId: number; autorId: number; mensagem: string }]
  'utilizador:registado': [{ userId: number; nome: string; email: string }]
  'acesso:solicitado':  [{ userId: number; conteudoId: string }]
  'acesso:aprovado':    [{ userId: number; conteudoId: string }]
  'acesso:rejeitado':   [{ userId: number; conteudoId: string }]
}

class AppEventBus extends EventEmitter {
  emit<K extends keyof AppEventMap>(event: K, ...args: AppEventMap[K]): boolean {
    return super.emit(event as string, ...args)
  }

  on<K extends keyof AppEventMap>(event: K, listener: (...args: AppEventMap[K]) => void): this {
    return super.on(event as string, listener as (...args: unknown[]) => void)
  }

  once<K extends keyof AppEventMap>(event: K, listener: (...args: AppEventMap[K]) => void): this {
    return super.once(event as string, listener as (...args: unknown[]) => void)
  }

  off<K extends keyof AppEventMap>(event: K, listener: (...args: AppEventMap[K]) => void): this {
    return super.off(event as string, listener as (...args: unknown[]) => void)
  }
}

// Singleton partilhado por toda a aplicação
export const eventBus = new AppEventBus()
eventBus.setMaxListeners(50)

// ── Handlers de notificação ────────────────────────────────────────────────────
// Desacopla a lógica de notificação dos controllers

eventBus.on('utilizador:registado', ({ userId, nome }) => {
  console.log(`[evento] Utilizador registado: ${nome} (id=${userId})`)
  // Aqui poderia disparar email de boas-vindas, notificação push, etc.
})

eventBus.on('acesso:solicitado', ({ userId, conteudoId }) => {
  console.log(`[evento] Acesso solicitado — utilizador=${userId}, conteúdo=${conteudoId}`)
  // Aqui poderia notificar administradores via notificação/email
})

eventBus.on('acesso:aprovado', ({ userId, conteudoId }) => {
  console.log(`[evento] Acesso aprovado — utilizador=${userId}, conteúdo=${conteudoId}`)
  // Aqui poderia notificar o utilizador via notificação
})

eventBus.on('topico:respondido', ({ topicoId, autorId }) => {
  console.log(`[evento] Tópico ${topicoId} recebeu resposta de utilizador=${autorId}`)
  // Aqui poderia notificar o criador do tópico
})
