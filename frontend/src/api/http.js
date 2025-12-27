import axios from "axios";

export const http = axios.create({
    baseURL: "http://localhost:4000/api"
});

export function setAuthToken(token) {
    if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete http.defaults.headers.common.Authorization;
}
