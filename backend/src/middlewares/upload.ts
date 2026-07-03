import multer from 'multer'
import path from 'path'
import fs from 'fs'
import type { Request, Response, NextFunction } from 'express'

const DIR = path.resolve('uploads/forum')
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
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const multerMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB (para vídeos)
  fileFilter: (_req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Tipo de ficheiro não permitido.'))
  },
}).single('ficheiro')

// Só activa o multer se o pedido for multipart/form-data; caso contrário passa adiante
export function uploadForum(req: Request, res: Response, next: NextFunction) {
  const ct = req.headers['content-type'] ?? ''
  if (!ct.includes('multipart/form-data')) return next()
  multerMiddleware(req, res, next)
}
