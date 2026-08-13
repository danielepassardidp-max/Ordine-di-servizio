import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const http = axios.create({ baseURL: API, timeout: 20000 });

export async function fetchDays() {
    const { data } = await http.get("/days");
    return data;
}

export async function fetchPersonnel() {
    const { data } = await http.get("/personnel");
    return data.mapping;
}

export async function updatePersonnel({ code, name, full_code }) {
    const { data } = await http.put("/personnel", { code, name, full_code });
    return data;
}

export async function deletePersonnel(code) {
    const { data } = await http.delete(`/personnel/${code}`);
    return data;
}

export async function triggerSync() {
    const { data } = await http.post("/sync");
    return data;
}
