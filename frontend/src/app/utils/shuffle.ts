/**
 * Baralha um array (Fisher-Yates) e devolve uma NOVA cópia, sem mutar o original.
 * Usado para apresentar as perguntas e as opções dos quizzes em ordem aleatória,
 * de modo a que o utilizador não memorize posições nem respostas ao repetir.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
