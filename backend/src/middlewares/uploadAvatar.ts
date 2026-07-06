import multer from 'multer'
import path from 'path'
import fs from 'fs'

const DIR = path.resolve('uploads/avatars')
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIR),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname)
    // Prefixa com o id do utilizador autenticado para facilitar limpeza/depuração;
    // mantém-se único por pedido graças ao timestamp + sufixo aleatório.
    const uid  = (req as any).user?.userId ?? 'anon'
    const nome = `${uid}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, nome)
  },
})

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB — chega de sobra para uma foto de perfil
  fileFilter: (_req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Tipo de ficheiro não permitido. Usa JPEG, PNG ou WEBP.'))
  },
}).single('avatar')
