/* ================= DASHBOARD ================= */

import api from "./axios";

export const getStudentDashboardApi = async () => {
  const { data } = await api.get("/student/dashboard");
  return data;
};

/* ================= ASSIGNMENTS ================= */

export const getMyAssignmentsApi = async () => {
  const { data } = await api.get("/student/assignments");
  return data;
};

export const getAssignmentDetailsApi = async (id: string) => {
  const { data } = await api.get(`/student/assignments/${id}`);
  return data;
};

export const submitAssignmentApi = async (
  id: string,
  payload: {
    answers: {
      questionId: string;
      answer: string;
    }[];
  }
) => {
  const { data } = await api.post(
    `/student/assignments/${id}/submit`,
    payload
  );
  return data;
};

/* ================= SUBMISSIONS ================= */

export const getMySubmissionsApi = async () => {
  const { data } = await api.get("/student/submissions");
  return data;
};

export const getSubmissionDetailsApi = async (id: string) => {
  const { data } = await api.get(`/student/submissions/${id}`);
  return data;
};

export const getAvailableClassroomsApi = async () => {
  const { data } = await api.get("/student/classrooms");
  return data;
};

export const joinClassroomApi = async (inviteCode: string) => {
  const { data } = await api.post("/student/classrooms/join", {
    inviteCode,
  });
  return data;
};

export const getJoinedClassroomsApi = async () => {
  const { data } = await api.get("/student/classrooms/joined");
  return data;
};

export const getStudentClassroomDetailsApi = async (
  id: string
) => {
  const { data } = await api.get(
    `/student/classrooms/${id}`
  );
  return data;
};
