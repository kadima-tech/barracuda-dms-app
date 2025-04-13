import { API_BASE_URL, defaultOptions } from './config';

// Type for data that can be sent to the API
type ApiData = Record<string, unknown> | FormData;

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      method: 'GET',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async post<T>(endpoint: string, data: ApiData, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(!(data instanceof FormData) && {
        'Content-Type': 'application/json',
      }),
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      method: 'POST',
      headers,
      body: data instanceof FormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  },

  async put(endpoint: string, data: ApiData) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};
