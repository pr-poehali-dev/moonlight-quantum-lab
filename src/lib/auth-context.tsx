import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { api, User, clearToken } from "@/lib/api"

interface AuthContextValue {
  user: User | null
  loading: boolean
  setUser: (u: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export default AuthProvider
