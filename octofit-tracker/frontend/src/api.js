const apiOrigin = import.meta.env.VITE_API_URL || (
  __CODESPACE_NAME__
    ? `https://${__CODESPACE_NAME__}-8000.app.github.dev`
    : 'http://localhost:8000'
)

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('octofit-token')
  const response = await fetch(`${apiOrigin}/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (response.status === 204) return null
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Something went wrong. Please try again.')
  return result
}