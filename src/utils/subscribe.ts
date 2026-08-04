import { store } from "../Redux/store";
import { BASE_URL } from "../config";

export const PLANS = [
  { value: "FREE", label: "Free", price: "$0" },
  { value: "SILVER", label: "Silver", price: "$5" },
  { value: "GOLD", label: "Gold", price: "$15" },
  { value: "DIAMOND", label: "Diamond", price: "$49" },
] as const;

// Kicks off billing for the given plan using the logged-in session token.
// Returns the Stripe checkout URL for paid plans, or null for FREE.
export async function subscribeToPlan(plan: string): Promise<string | null> {
  const token = store.getState().auth.accessToken;
  if (!token) return null;

  const res = await fetch(`${BASE_URL}/api/v1/billing/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data?.url ?? null;
}
