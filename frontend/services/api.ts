export async function loginUser(data: { email: string; password: string }) {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Login failed");
  }

  return response.json();
}


export async function getContractStatus(id: number, token: string) {
  const response = await fetch(
    `http://127.0.0.1:8000/api/v1/contracts/${id}/status`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch contract status");
  }

  return response.json();
}


export async function refreshContract(id: number, token: string) {
  const response = await fetch(
    `http://127.0.0.1:8000/api/v1/contracts/${id}/refresh`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to refresh contract");
  }

  return response.json();
}


export async function getContractClauses(id: number, token: string) {
  const response = await fetch(
    `http://127.0.0.1:8000/api/v1/clauses/contract/${id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch clauses");
  }

  return response.json();
}