const DEFAULT_BACKEND_URL = 'https://safetex-1.onrender.com'

export const getApiBaseUrl = () => {
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
        hostname === 'safe-tex-git-main-tharuns-projects-7933d4cd.vercel.app') {
      return DEFAULT_BACKEND_URL
    }
  }

  return DEFAULT_BACKEND_URL
}

export default getApiBaseUrl
