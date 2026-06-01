import { useCallback, useState } from 'react'

export function useAsyncTask<TArgs extends unknown[], TResult>(
  task: (...args: TArgs) => Promise<TResult>,
) {
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TResult | null>(null)

  const run = useCallback(
    async (...args: TArgs) => {
      setIsRunning(true)
      setError(null)
      try {
        const result = await task(...args)
        setData(result)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro inesperado'
        setError(message)
        throw err
      } finally {
        setIsRunning(false)
      }
    },
    [task],
  )

  const reset = useCallback(() => {
    setIsRunning(false)
    setError(null)
    setData(null)
  }, [])

  return { run, reset, isRunning, error, data }
}

