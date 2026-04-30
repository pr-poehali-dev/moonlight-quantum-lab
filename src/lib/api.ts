import urls from "../../backend/func2url.json"

const AUTH_URL = urls.auth
const CATEGORIES_URL = urls.categories
const LISTINGS_URL = urls.listings

const TOKEN_KEY = "market_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["X-Auth-Token"] = token
  return headers
}

export interface User {
  id: number
  email: string
  name: string
  phone: string
  city: string
  avatar_url: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  parent_id: number | null
  sort_order: number
}

export interface ListingShort {
  id: number
  title: string
  price: number | null
  currency: string
  city: string
  images: string[]
  created_at: string
  views_count: number
  category_name: string
  category_slug: string
  user_id: number
}

export interface ListingFull extends ListingShort {
  description: string
  status: string
  category: { id: number; name: string; slug: string } | null
  seller: { id: number; name: string; phone: string; avatar_url: string }
}

export const api = {
  async register(data: { email: string; password: string; name: string; phone?: string; city?: string }) {
    const r = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await r.json()
    if (!r.ok) throw new Error(json.error || "Ошибка регистрации")
    setToken(json.token)
    return json.user as User
  },

  async login(data: { email: string; password: string }) {
    const r = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await r.json()
    if (!r.ok) throw new Error(json.error || "Ошибка входа")
    setToken(json.token)
    return json.user as User
  },

  async me(): Promise<User | null> {
    const token = getToken()
    if (!token) return null
    const r = await fetch(`${AUTH_URL}?action=me`, { headers: authHeaders() })
    if (!r.ok) {
      clearToken()
      return null
    }
    const json = await r.json()
    return json.user as User
  },

  async getCategories(): Promise<Category[]> {
    const r = await fetch(CATEGORIES_URL)
    const json = await r.json()
    return json.categories
  },

  async getListings(params: Record<string, string> = {}): Promise<ListingShort[]> {
    const qs = new URLSearchParams(params).toString()
    const r = await fetch(`${LISTINGS_URL}${qs ? "?" + qs : ""}`, { headers: authHeaders() })
    const json = await r.json()
    return json.listings || []
  },

  async getListing(id: number): Promise<ListingFull> {
    const r = await fetch(`${LISTINGS_URL}?id=${id}`)
    const json = await r.json()
    if (!r.ok) throw new Error(json.error)
    return json.listing
  },

  async createListing(data: {
    title: string
    description: string
    price?: number | null
    city?: string
    category_id: number
    images?: string[]
  }) {
    const r = await fetch(LISTINGS_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    const json = await r.json()
    if (!r.ok) throw new Error(json.error || "Ошибка создания")
    return json.id as number
  },

  async deleteListing(id: number) {
    const r = await fetch(`${LISTINGS_URL}?id=${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
    const json = await r.json()
    if (!r.ok) throw new Error(json.error)
    return true
  },
}
