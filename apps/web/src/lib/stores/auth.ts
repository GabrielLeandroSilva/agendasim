import { writable } from 'svelte/store'
import { browser } from '$app/environment'

type AuthState = {
  token: string | null
  user: { id: string; name: string; email: string } | null
}

const initial: AuthState = {
  token: browser ? localStorage.getItem('token') : null,
  user: browser ? JSON.parse(localStorage.getItem('user') || 'null') : null
}

export const auth = writable<AuthState>(initial)

export function setAuth(token: string, user: AuthState['user']) {
  if (browser) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }
  auth.set({ token, user })
}

export function clearAuth() {
  if (browser) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  auth.set({ token: null, user: null })
}