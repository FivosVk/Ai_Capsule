// api.js - tiny fetch wrapper.
// `credentials: "include"` is the important bit: it makes the browser send the
// httpOnly "token" cookie along with every request, which is how the backend
// knows who is asking.

async function request(path, options = {}) {
    const res = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  
    if (res.status === 401) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
  
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
  
    if (res.status === 204) return null;
    return res.json();
  }
  
  export const api = {
    health: () => request("/api/health"),
    listCapsules: () => request("/api/capsules"),
    createCapsule: (data) =>
      request("/api/capsules", { method: "POST", body: JSON.stringify(data) }),
    updateCapsule: (id, data) =>
      request(`/api/capsules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: "DELETE" }),
  };