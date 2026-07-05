export interface Profile {
  user_id?: string
  name: string
  email: string
  phone?: string
  skills: string[]
  education: Education[]
  experience: Experience[]
  projects: Project[]
  saved_internships?: number[]
}

export interface Education {
  degree?: string
  institution?: string
  year?: string
}

export interface Experience {
  role?: string
  company?: string
  duration?: string
}

export interface Project {
  title?: string
  description?: string
  technologies?: string[]
}

export interface JobMatch {
  id?: number
  job_title: string
  company: string
  score: number
  location?: string
  stipend?: string
  duration?: string
  url?: string
  matched_skills: string[]
  missing_skills: string[]
  source?: string
  matched_projects?: string[]
  suitability_assessment?: string
  suitability_level?: string
}

export interface MatchFilters {
  email?: string
  keyword?: string
  location?: string
  remoteOnly?: boolean
  stipendMin?: number
  durationMax?: number
}
