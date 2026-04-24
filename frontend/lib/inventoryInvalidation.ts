const INVENTORY_CHANGED_KEY = 'pg:inventory-changed-at'

export function markInventoryChanged() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(INVENTORY_CHANGED_KEY, String(Date.now()))
}

export function getInventoryChangedAt() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(INVENTORY_CHANGED_KEY)
}
