export type BillingPlan = {
  id: "starter" | "pro" | "business";
  name: string;
  price: number;
  durationDays: number;
  monthlyRequestLimit: number;
  features: string[];
};

export const plans: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    durationDays: 30,
    monthlyRequestLimit: 10000,
    features: [
      "10,000 requests / month",
      "Rotating proxies",
      "Basic sticky sessions",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    durationDays: 30,
    monthlyRequestLimit: 50000,
    features: [
      "50,000 requests / month",
      "Country targeting",
      "Advanced sticky sessions",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 199,
    durationDays: 30,
    monthlyRequestLimit: 200000,
    features: [
      "200,000 requests / month",
      "Dedicated proxy pools",
      "Higher concurrency",
      "Fast-track support",
    ],
  },
];
