const DEFAULT_MIN_DELAY_MS = 650

export async function withMinDelay<T>(
  task: Promise<T>,
  minDelayMs = DEFAULT_MIN_DELAY_MS,
) {
  const [result] = await Promise.all([task, delay(minDelayMs)])

  return result
}

function delay(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}
