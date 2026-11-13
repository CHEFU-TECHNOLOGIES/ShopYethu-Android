export const API_BASE = "https://api.chefu.co.za".replace(/\/$/, "");
export const ACCOUNT_BASE = "https://myaccount.chefu.co.za";
export const CLIENT_ID = "shopyethu-mobile";
export const REDIRECT_URI = "shopyethu://sso-callback";
if (!API_BASE.startsWith("https://"))
    throw new Error("Marketplace requests require HTTPS.");
export const categories = [
    "All",
    "Accessories",
    "Home & Living",
    "Pantry",
    "Beauty",
    "Clothing",
    "Other",
];
