const API_URL = "http://127.0.0.1:8000/api/v1";

export async function getDashboardMetrics() {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/dashboard/metrics`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard metrics");
  }

  return response.json();
}