import axios from 'axios'

export function getFriendlyError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }

    if (error.message) {
      return error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ocorreu um erro inesperado'
}

