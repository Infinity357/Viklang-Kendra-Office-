import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId) => {
    try {
      console.log('🔍 Fetching profile for user ID:', userId)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        
        // If no profile exists, try by email
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser()
          const email = userData.user.email
          
          console.log('📧 Trying to find profile by email:', email)
          
          const { data: profileByEmail, error: emailError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .single()
          
          if (!emailError && profileByEmail) {
            // Update the profile with correct ID
            console.log('🔄 Updating profile with correct ID')
            const { data: updatedProfile, error: updateError } = await supabase
              .from('user_profiles')
              .update({ id: userId })
              .eq('email', email)
              .select()
              .single()
            
            if (!updateError) {
              console.log('✅ Profile updated:', updatedProfile)
              setProfile(updatedProfile)
              return
            }
          }
          
          // Create new profile if none exists
          console.log('📝 Creating new profile for:', email)
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{ 
              id: userId, 
              email: email, 
              role: 'employee' 
            }])
            .select()
            .single()
          
          if (!insertError) {
            console.log('✅ Created new profile:', newProfile)
            setProfile(newProfile)
          }
        }
        return
      }

      console.log(' Profile fetched successfully:', data)
      console.log(' User role:', data.role)
      console.log(' Is admin?', data.role === 'admin')
      
      setProfile(data)
    } catch (error) {
      console.error(' Error in fetchUserProfile:', error)
    }
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔄 Session check:', session ? 'Logged in' : 'Not logged in')
      if (session) {
        console.log(' User session found:', session.user.email)
        setUser(session.user)
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔄 Auth state changed:', _event)
        if (session) {
          console.log(' User signed in:', session.user.email)
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          console.log(' User signed out')
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    console.log('🔐 Attempting sign in for:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error(' Sign in error:', error)
      throw error
    }
    console.log('✅ Sign in successful:', data.user.email)
    return data
  }

  const signOut = async () => {
    console.log(' Signing out')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshProfile = async () => {
    if (!user) return
    console.log(' Refreshing profile...')
    await fetchUserProfile(user.id)
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
    isAdmin: profile?.role === 'admin',
    isEmployee: profile?.role === 'employee',
  }

  console.log(' Current auth state:', {
    user: user?.email,
    profile: profile,
    role: profile?.role,
    isAdmin: profile?.role === 'admin'
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
