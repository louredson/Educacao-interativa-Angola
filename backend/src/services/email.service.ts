import nodemailer from 'nodemailer'
import path from 'path'
import fs   from 'fs'
import { env } from '../config/env.js'

// ── Transporter ──────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host:   env.emailHost,
    port:   env.emailPort,
    secure: env.emailSecure,   // true → SSL/465 | false → STARTTLS/587
    auth: {
      user: env.emailUser,
      pass: env.emailPass,
    },
  })
}

function smtpConfigured(): boolean {
  return env.emailUser !== '' && env.emailPass !== ''
}

// ── Log local (desenvolvimento sem SMTP real) ─────────────────────────────────
function logEmail(to: string, subject: string, link: string): void {
  const logDir  = new URL('../../logs', import.meta.url).pathname
  const logFile = path.join(logDir, 'emails.log')
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    const sep   = '='.repeat(65)
    const entry = [
      '',
      sep,
      ` DATA:    ${new Date().toISOString()}`,
      ` PARA:    ${to}`,
      ` ASSUNTO: ${subject}`,
      ` LINK:    ${link}`,
      sep,
      '',
    ].join('\n')
    fs.appendFileSync(logFile, entry)
    console.log(`📧 [EMAIL-LOG] Para: ${to}`)
    console.log(`🔗 [EMAIL-LOG] Link: ${link}`)
  } catch {
    console.warn('⚠️  Não foi possível escrever em logs/emails.log')
  }
}

// ── Templates HTML ────────────────────────────────────────────────────────────
function tplRecuperacao(nome: string, url: string): string {
  const n = nome.replace(/</g, '&lt;')
  return `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
    <div style="text-align:center;padding:2rem 0 1rem">
      <span style="font-size:2.5rem">📚</span>
      <h2 style="margin:.5rem 0;color:#1e293b">Economia com História</h2>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:2rem;border:1px solid #e2e8f0">
      <h3 style="color:#b91c1c;margin-top:0">Recuperação de Senha</h3>
      <p>Olá <strong>${n}</strong>,</p>
      <p>Recebemos um pedido para redefinir a senha da tua conta. Clica no botão abaixo:</p>
      <div style="text-align:center;margin:2rem 0">
        <a href="${url}"
           style="background:#b91c1c;color:#fff;padding:.85rem 2rem;border-radius:8px;
                  text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">
          🔐 Redefinir Senha
        </a>
      </div>
      <p style="font-size:.85rem;color:#64748b">
        Ou copia este link:<br>
        <a href="${url}" style="color:#b91c1c;word-break:break-all">${url}</a>
      </p>
    </div>
    <div style="padding:1.5rem;font-size:.8rem;color:#94a3b8;text-align:center">
      Este link expira em <strong>1 hora</strong>.<br>
      Se não fizeste este pedido, podes ignorar este email.
    </div>
  </div>`
}

function tplBoasVindas(nome: string): string {
  const n = nome.replace(/</g, '&lt;')
  return `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
    <div style="text-align:center;padding:2rem 0 1rem">
      <span style="font-size:2.5rem">📚</span>
      <h2 style="margin:.5rem 0">Economia com História</h2>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:2rem;border:1px solid #e2e8f0">
      <h3 style="color:#b91c1c;margin-top:0">Bem-vindo, ${n}!</h3>
      <p>A tua conta foi criada com sucesso.</p>
      <p>Já podes explorar conteúdos sobre a história económica de Angola,
         participar em quizzes e no fórum.</p>
      <div style="text-align:center;margin:2rem 0">
        <a href="${env.frontendUrl}"
           style="background:#b91c1c;color:#fff;padding:.85rem 2rem;border-radius:8px;
                  text-decoration:none;font-weight:700;display:inline-block">
          Aceder à plataforma
        </a>
      </div>
    </div>
  </div>`
}

// ── Funções públicas ──────────────────────────────────────────────────────────
export async function enviarEmailRecuperacao(
  nome:  string,
  email: string,
  token: string,
): Promise<void> {
  const link    = `${env.frontendUrl}/redefinir-senha?token=${token}`
  const subject = 'Recuperação de Senha — Economia com História'

  // Regista sempre em log (útil para depuração mesmo com SMTP activo)
  logEmail(email, subject, link)

  if (!smtpConfigured()) {
    console.warn('⚠️  EMAIL_USER/EMAIL_PASS não configurados — email não enviado. Ver logs/emails.log para o link.')
    return
  }

  try {
    const info = await createTransporter().sendMail({
      from:    env.emailFrom,
      to:      email,
      subject,
      html:    tplRecuperacao(nome, link),
    })
    console.log(`✅ Email de recuperação enviado para ${email} (messageId: ${info.messageId})`)
  } catch (err) {
    // Agora o erro é visível nos logs do servidor
    console.error('❌ SMTP falhou ao enviar email de recuperação:', err)
    console.log(`🔗 Link de recuperação (usar manualmente): ${link}`)
  }
}

export async function enviarEmailBoasVindas(
  nome:  string,
  email: string,
): Promise<void> {
  if (!smtpConfigured()) return

  try {
    await createTransporter().sendMail({
      from:    env.emailFrom,
      to:      email,
      subject: 'Bem-vindo à Economia com História!',
      html:    tplBoasVindas(nome),
    })
    console.log(`✅ Email de boas-vindas enviado para ${email}`)
  } catch (err) {
    console.warn('⚠️  Email de boas-vindas não enviado:', err)
  }
}
