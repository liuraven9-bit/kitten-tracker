import { useSyncExternalStore } from 'react'
import { subscribe, getData } from './store'

export function useData() {
  return useSyncExternalStore(subscribe, getData)
}
