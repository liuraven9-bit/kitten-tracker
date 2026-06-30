import { useSyncExternalStore } from 'react'
import { subscribe, getData } from './store'

// Subscribe React to the localStorage-backed store.
export function useData() {
  return useSyncExternalStore(subscribe, getData)
}
