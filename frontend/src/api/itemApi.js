import API from "./axios";

export const getItems = (params) => API.get("/items", { params });
export const getItem = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post("/items", data);
export const updateItem = (id, data) => API.put(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);
export const getStats = () => API.get("/items/stats");
export const exportCSV = () =>
  API.get("/items/export", { responseType: "blob" });
