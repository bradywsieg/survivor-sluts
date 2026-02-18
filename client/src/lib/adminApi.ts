const PIN_STORAGE_KEY = "commissioner_authed";
const PIN_VALUE_KEY = "commissioner_pin";

export function isAdminAuthed(): boolean {
  return localStorage.getItem(PIN_STORAGE_KEY) === "true";
}

export function getStoredPin(): string {
  return localStorage.getItem(PIN_VALUE_KEY) || "";
}

export function setAdminAuthed(pin: string) {
  localStorage.setItem(PIN_STORAGE_KEY, "true");
  localStorage.setItem(PIN_VALUE_KEY, pin);
}

export function clearAdminAuth() {
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(PIN_VALUE_KEY);
}

export async function adminApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const pin = getStoredPin();
  const headers: Record<string, string> = {
    "X-Commissioner-Pin": pin,
  };
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}
