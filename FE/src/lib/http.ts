import axios from 'axios'

export const http = axios.create({
  // Relative URLs: Vite proxies /api to the backend in development.
  baseURL: '',
})
