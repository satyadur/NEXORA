import api from "./axios";

export const getAssignmentsApi = async () => {
  const res = await api.get("/assignments");
  return res.data.data;
};

export const createAssignmentApi = async (payload: any) => {
  const res = await api.post("/assignments", payload);
  return res.data;
};
