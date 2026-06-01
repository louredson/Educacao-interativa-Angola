export function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatRole(role?: string | null) {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'subscrito':
      return 'Subscrito'
    case 'visitante':
      return 'Visitante'
    default:
      return role ?? '-'
  }
}

