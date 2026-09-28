import { useEffect, useState } from 'react'
import { apiRequest } from './api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('octofit-token')))

  useEffect(() => {
    if (!localStorage.getItem('octofit-token')) return
    apiRequest('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('octofit-token'))
      .finally(() => setLoading(false))
  }, [])

  async function authenticate(path, body) {
    const result = await apiRequest(path, { method: 'POST', body })
    localStorage.setItem('octofit-token', result.token)
    setUser(result.user)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login: (email, password) => authenticate('/auth/login', { email, password }),
      register: (details) => authenticate('/auth/register', details),
      logout: () => { localStorage.removeItem('octofit-token'); setUser(null) },
      updateUser: setUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}