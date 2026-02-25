import api from "./axios"

/* ================= PUBLIC FACULTY ================= */

export interface PublicFaculty {
  _id: string
  name: string
  avatar?: string
}

export const getPublicFaculty = async (): Promise<PublicFaculty[]> => {
  const res = await api.get("/public/faculty")
  return res.data
}

/* ================= TOP STUDENTS ================= */

export interface TopStudent {
  _id: string
  name: string
  avatar?: string
  averageScore: number
}

export const getTopStudents = async (): Promise<TopStudent[]> => {
  const res = await api.get("/public/top-students")
  return res.data
}
