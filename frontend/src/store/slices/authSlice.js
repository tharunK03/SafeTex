import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      state.loading = false
      state.error = null
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
    },
  },
})

export const { setUser, setLoading, setError, logout } = authSlice.actions

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  PRODUCTION_MANAGER: 'production_manager'
}

// Helper function to get role display name
export const getUserRoleDisplayName = (role) => {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'sales':
      return 'Sales Representative'
    case 'production_manager':
      return 'Production Manager'
    default:
      return 'User'
  }
}

export default authSlice.reducer 