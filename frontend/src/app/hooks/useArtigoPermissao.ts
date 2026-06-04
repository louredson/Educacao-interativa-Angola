/**
 * useArtigoPermissao.ts
 * Hook que verifica se o utilizador autenticado pode criar artigos.
 *
 * Uso:
 *   const { permitido, podePublicar, loading } = useArtigoPermissao()
 *
 *   {permitido && <Link to="/admin/artigos/novo">Criar Artigo</Link>}
 */
import { useState, useEffect } from 'react'
import { apiRequest } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface PermissaoArtigo {
  permitido: boolean
  podePublicar: boolean
  loading: boolean
}

export function useArtigoPermissao(): PermissaoArtigo {
  const { user } = useAuth()
  const [permitido,     setPermitido]     = useState(false)
  const [podePublicar,  setPodePublicar]  = useState(false)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!user) {
      setPermitido(false)
      setPodePublicar(false)
      setLoading(false)
      return
    }

    // Admin — sem necessidade de chamar a API
    if (user.role === 'admin') {
      setPermitido(true)
      setPodePublicar(true)
      setLoading(false)
      return
    }

    // Utilizador normal — consultar o backend
    apiRequest<{ permitido: boolean; pode_publicar: boolean }>('/artigos/minha-permissao')
      .then(r => {
        setPermitido(r.permitido)
        setPodePublicar(r.pode_publicar)
      })
      .catch(() => {
        setPermitido(false)
        setPodePublicar(false)
      })
      .finally(() => setLoading(false))
  }, [user])

  return { permitido, podePublicar, loading }
}
