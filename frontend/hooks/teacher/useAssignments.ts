"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

export const useTeacherAssignments = () =>
  useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: async () => {
      const { data } = await axios.get("/teacher/assignments")
      return data
    },
  })

export const useCreateAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: any) =>
      axios.post("/teacher/assignments", payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] })
    },
  })
}

export const useAssignmentDetails = (id: string) =>
  useQuery({
    queryKey: ["teacher-assignment", id],
    queryFn: async () => {
      const { data } = await axios.get(`/teacher/assignments/${id}`)
      return data
    },
    enabled: !!id,
  })
