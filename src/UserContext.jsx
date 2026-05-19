import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true })
      if (data && data.length > 0) {
        setUsers(data)
        setCurrentUser(data[0])
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

  return (
    <UserContext.Provider value={{ users, currentUser, setCurrentUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}