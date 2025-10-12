// Backend API URL configuration
export const DEFAULT_BACKEND_URL = 'https://safetex-1.onrender.com'

// Function to get the API base URL based on environment and hostname
export const getApiBaseUrl = () => {
  // Log environment and window location for debugging
  if (typeof window !== 'undefined') {
    console.log('Window location:', window.location.toString())
    console.log('Environment API URL:', import.meta.env.VITE_API_URL)
  }
  const envUrl = import.meta.env.VITE_API_URL?.trim()

  if (envUrl) {
    if (typeof window !== 'undefined') {
      const isHttpsPage = window.location.protocol === 'https:'
      const isLocalTarget = envUrl.includes('localhost') || envUrl.includes('127.0.0.1')

      if (isHttpsPage && envUrl.startsWith('http://') && !isLocalTarget) {
        return envUrl.replace('http://', 'https://')
      }
    }
    return envUrl
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000'
    }

    if (hostname === 'safetexenterprises.vercel.app' || 
        hostname === 'safe-tex-tharuns-projects-7933d4cd.vercel.app' ||
        hostname === 'safe-tex-git-main-tharuns-projects-7933d4cd.vercel.app' ||
        hostname === 'safe-tex.vercel.app') {
      return DEFAULT_BACKEND_URL
    }
  }

  return DEFAULT_BACKEND_URL
}

export default getApiBaseUrl
