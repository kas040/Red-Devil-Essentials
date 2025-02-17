const VALID_PROMO_CODE = "RDE-2025-Proef";

export function validatePromoCode(code: string): boolean {
  return code.trim().toUpperCase() === VALID_PROMO_CODE;
}
