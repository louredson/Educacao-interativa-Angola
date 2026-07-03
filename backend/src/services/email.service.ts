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

function tplBoasVindasProfessor(nome: string, email: string, password: string): string {
  const n = nome.replace(/</g, '&lt;')
  const loginUrl = `${env.frontendUrl}/login`
  return `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
    <div style="text-align:center;padding:2rem 0 1rem">
      <span style="font-size:2.5rem">🎓</span>
      <h2 style="margin:.5rem 0">Economia com História</h2>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:2rem;border:1px solid #e2e8f0">
      <h3 style="color:#800020;margin-top:0">Parabéns, ${n}!</h3>
      <p>Foste registado(a) como <strong>Professor</strong> na plataforma Economia com História.
         Já podes publicar conteúdos — incluindo Textos com Jindungo — e geres os pedidos de
         acesso a esses textos a partir do teu perfil.</p>

      <div style="background:#fff;border-radius:10px;padding:1.25rem 1.5rem;border:1px solid #e2e8f0;margin:1.5rem 0">
        <p style="margin:0 0 .5rem;font-size:.8rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em">
          As tuas credenciais de acesso
        </p>
        <p style="margin:.25rem 0"><strong>Email:</strong> ${email.replace(/</g, '&lt;')}</p>
        <p style="margin:.25rem 0"><strong>Senha:</strong> ${password.replace(/</g, '&lt;')}</p>
        <p style="margin:.75rem 0 0;font-size:.8rem;color:#94a3b8">
          Por segurança, recomendamos que alteres a senha depois do primeiro acesso.
        </p>
      </div>

      <div style="text-align:center;margin:2rem 0">
        <a href="${loginUrl}"
           style="background:#800020;color:#fff;padding:.85rem 2rem;border-radius:8px;
                  text-decoration:none;font-weight:700;display:inline-block">
          Iniciar sessão
        </a>
      </div>
    </div>
    <div style="padding:1.5rem;font-size:.8rem;color:#94a3b8;text-align:center">
      Se não esperavas este email, contacta a administração da plataforma.
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

function tplConvite(nomeConvidado: string, nomeEntidade: string, tipoEntidade: string, url: string, codigo: string): string {
  const n = nomeConvidado.replace(/</g, '&lt;')
  const e = nomeEntidade.replace(/</g, '&lt;')
  return `
  <div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
    <div style="text-align:center;padding:2rem 0 1rem">
      <span style="font-size:2.5rem">📚</span>
      <h2 style="margin:.5rem 0">Economia com História</h2>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:2rem;border:1px solid #e2e8f0">
      <h3 style="color:#b91c1c;margin-top:0">Convite para ${tipoEntidade}</h3>
      <p>Olá <strong>${n}</strong>,</p>
      <p>Foste convidado para participar em <strong>${e}</strong>.</p>
      <div style="text-align:center;margin:2rem 0">
        <a href="${url}"
           style="background:#b91c1c;color:#fff;padding:.85rem 2rem;border-radius:8px;
                  text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">
          Aceitar Convite
        </a>
      </div>
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:1rem;margin:1rem 0;text-align:center">
        <p style="margin:0;font-size:.85rem;color:#856404">Código de acesso</p>
        <p style="margin:.5rem 0 0;font-size:1.5rem;font-weight:700;letter-spacing:.2em;color:#1e293b">${codigo}</p>
      </div>
      <p style="font-size:.85rem;color:#64748b">
        Ou usa o código acima ao entrar na plataforma.
      </p>
    </div>
    <div style="padding:1.5rem;font-size:.8rem;color:#94a3b8;text-align:center">
      Se não conheces esta plataforma, podes ignorar este email.
    </div>
  </div>`
}

export async function enviarEmailConvite(
  emailDestino: string,
  nomeConvidado: string,
  nomeEntidade: string,
  tipoEntidade: 'Sala de Discussão' | 'Tópico Privado',
  codigo: string,
): Promise<void> {
  const url = `${env.frontendUrl}/entrar-convite?codigo=${codigo}`
  const subject = `Convite para ${tipoEntidade} — Economia com História`

  logEmail(emailDestino, subject, url)

  if (!smtpConfigured()) {
    console.warn(`⚠️  SMTP não configurado — convite para ${emailDestino} registado em logs.`)
    return
  }

  try {
    await createTransporter().sendMail({
      from:    env.emailFrom,
      to:      emailDestino,
      subject,
      html:    tplConvite(nomeConvidado, nomeEntidade, tipoEntidade, url, codigo),
    })
    console.log(`✅ Convite enviado para ${emailDestino}`)
  } catch (err) {
    console.error('❌ SMTP falhou ao enviar convite:', err)
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

/**
 * Email enviado ao professor quando o administrador cria a sua conta —
 * inclui as credenciais (email + senha em texto simples, definidas pelo
 * admin no formulário "Criar Professor") e um botão para o ecrã de login.
 * Só pode incluir a senha em texto aqui, antes de ser encriptada — por isso
 * esta função tem de ser chamada logo após a criação do utilizador, com a
 * senha ainda disponível em memória.
 */
export async function enviarEmailBoasVindasProfessor(
  nome:     string,
  email:    string,
  password: string,
): Promise<void> {
  const subject = 'Foste registado(a) como Professor — Economia com História'
  logEmail(email, subject, `Credenciais enviadas para ${email}`)

  if (!smtpConfigured()) {
    console.warn('⚠️  EMAIL_USER/EMAIL_PASS não configurados — email não enviado. Ver logs/emails.log.')
    return
  }

  try {
    await createTransporter().sendMail({
      from:    env.emailFrom,
      to:      email,
      subject,
      html:    tplBoasVindasProfessor(nome, email, password),
    })
    console.log(`✅ Email de boas-vindas (professor) enviado para ${email}`)
  } catch (err) {
    console.error('❌ SMTP falhou ao enviar email de boas-vindas ao professor:', err)
  }
}
