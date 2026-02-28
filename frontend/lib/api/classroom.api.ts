import api from "./axios"

/* ==============================
   CLASSROOM TYPE
============================== */

export interface Classroom {
  _id: string
  name: string
  description?: string
  teacher: {
    _id: string
    name: string
    email: string
  } | null
  students: {
    _id: string
    name: string
    email: string
  }[]
  inviteCode?: string
  status: "ACTIVE" | "INACTIVE" | "COMPLETED"
  createdAt: string
  updatedAt: string
}


/* ==============================
   UPDATE PAYLOAD
============================== */

export interface UpdateClassroomPayload {
  id: string
  name: string
  teacher: string
  status: "ACTIVE" | "INACTIVE"   // ✅ ADD THIS
}

export const updateClassroomApi = async (
  payload: UpdateClassroomPayload
) => {
  const { id, ...data } = payload
  const res = await api.put(`/classrooms/${id}`, data)
  return res.data
}

/* ==============================
   GET CLASSROOMS
============================== */

export const getClassrooms = async (): Promise<Classroom[]> => {
  const res = await api.get("/classrooms")
  return res.data
}

/* ==============================
   CREATE PAYLOAD
============================== */

export interface CreateClassroomPayload {
  name: string
  teacher: string
  status?: "ACTIVE" | "INACTIVE"   // optional
}

export const createClassroomApi = async (
  payload: CreateClassroomPayload
) => {
  const res = await api.post("/classrooms", payload)
  return res.data
}

/* ==============================
   DELETE
============================== */

export const deleteClassroomApi = async (id: string) => {
  const res = await api.delete(`/classrooms/${id}`)
  return res.data
}

/* ==============================
   ADD STUDENT
============================== */

export const addStudentToClassroomApi = async (
  id: string,
  studentId: string
) => {
  const res = await api.put(`/classrooms/${id}/add-student`, {
    studentId,
  })
  return res.data
}
