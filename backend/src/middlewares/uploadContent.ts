import multer from 'multer'
import path from 'path'
import fs from 'fs'

const DIR = path.resolve('uploads/content')
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname)
    const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, nome)
  },
})

const TIPOS_PERMITIDOS = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp4', 'audio/x-wav',
]

export const uploadContent = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Tipo de ficheiro não permitido.'))
  },
}).single('ficheiro')
