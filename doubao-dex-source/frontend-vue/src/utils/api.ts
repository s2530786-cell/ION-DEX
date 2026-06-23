import axios from 'axios'

const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: BASE_API,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

// Asset API
export async function getAssets(wallet: string, chain: string) {
  return api.get('/asset/list', { params: { wallet, chain } })
}

// Transaction API
export async function getTransactions(wallet: string, chain: string, page = 1, size = 20) {
  return api.get('/tx/list', { params: { wallet, chain, page, size } })
}

// LP Staking API
export async function getLpStakes(wallet: string, chain: string) {
  return api.get('/lp/list', { params: { wallet, chain } })
}

// Token Price API
export async function getTokenPrice(chain: string, contract: string) {
  return api.get('/price/token', { params: { chain, contract } })
}

// Kline API
export async function getKlineData(chain: string, contract: string, period = '1m') {
  return api.get('/price/kline/data', { params: { chain, contract, period } })
}

// Risk check
export async function checkRiskAddress(address: string) {
  return api.get('/risk/check-address', { params: { addr: address } })
}

// Auth
export async function login(address: string, signature: string, message: string) {
  return api.post('/auth/login', { address, signature, message })
}

// User profile
export async function getUserProfile(chain: string) {
  return api.get('/user/profile', { params: { chain } })
}

export async function updateUserSetting(chain: string, data: Record<string, any>) {
  return api.post('/user/setting', data, { params: { chain } })
}

// Notifications
export async function getNotices(chain: string, page = 1, size = 20) {
  return api.get('/notice/list', { params: { chain, page, size } })
}

export async function readAllNotices(chain: string) {
  return api.post('/notice/read-all', {}, { params: { chain } })
}

// Stats
export async function getGlobalStats() {
  return api.get('/stats/global')
}
