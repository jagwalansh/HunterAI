import type { JobMatch, MatchFilters, Profile } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

let authToken: string | null = null

function getHeaders(customHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...customHeaders }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  return headers
}

async function parseError(res: Response, fallback: string) {
  try {
    const body = await res.json()
    return body?.detail || fallback
  } catch {
    return fallback
  }
}

export function createMockToken() {
  const stored = localStorage.getItem('hunterai_mock_user')
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { id: string; email: string; name: string }
      return `mock_token:${parsed.id}:${parsed.email}:${parsed.name}`
    } catch {
      localStorage.removeItem('hunterai_mock_user')
    }
  }

  const guestId = localStorage.getItem('hunterai_guest_id') || `guest_${Math.random().toString(36).slice(2, 11)}`
  localStorage.setItem('hunterai_guest_id', guestId)
  return `mock_token:${guestId}:${guestId}@hunterai.local:Guest User`
}

export const api = {
  setToken(token: string | null) {
    authToken = token
  },

  async uploadResume(file: File): Promise<{ message: string; file_name: string; profile: Profile }> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${BASE_URL}/file/upload/resume`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    })

    if (!res.ok) {
      throw new Error(await parseError(res, `Upload failed with status ${res.status}`))
    }

    return res.json()
  },

  async getProfiles(): Promise<Profile[]> {
    const res = await fetch(`${BASE_URL}/profiles`, {
      headers: getHeaders(),
    })
    if (!res.ok) {
      throw new Error(await parseError(res, 'Failed to load profiles'))
    }
    return res.json()
  },

  async getMatches(filters: MatchFilters = {}): Promise<JobMatch[]> {
    const params = new URLSearchParams()
    if (filters.email) params.set('email', filters.email)
    if (filters.keyword) params.set('keyword', filters.keyword)
    if (filters.location) params.set('location', filters.location)
    if (filters.remoteOnly) params.set('remote_only', 'true')
    if (filters.stipendMin) params.set('stipend_min', String(filters.stipendMin))
    if (filters.durationMax) params.set('duration_max', String(filters.durationMax))

    const query = params.toString()
    const res = await fetch(`${BASE_URL}/matches${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    })

    if (res.status === 400) return []
    if (!res.ok) {
      throw new Error(await parseError(res, 'Failed to load matches'))
    }

    return res.json()
  },

  async getSavedInternships(): Promise<JobMatch[]> {
    const res = await fetch(`${BASE_URL}/profile/saved`, {
      headers: getHeaders(),
    })
    if (!res.ok) {
      throw new Error(await parseError(res, 'Failed to load saved internships'))
    }
    return res.json()
  },

  async saveInternship(jobId: number) {
    const res = await fetch(`${BASE_URL}/profile/saved`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ job_id: jobId }),
    })
    if (!res.ok) {
      throw new Error(await parseError(res, 'Failed to save internship'))
    }
    return res.json()
  },

  async unsaveInternship(jobId: number) {
    const res = await fetch(`${BASE_URL}/profile/saved/${jobId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!res.ok) {
      throw new Error(await parseError(res, 'Failed to unsave internship'))
    }
    return res.json()
  },

  async chat(message: string) {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message }),
    })
    if (!res.ok) {
      throw new Error(await parseError(res, 'Failed to chat'))
    }
    return res.json()
  },
}
