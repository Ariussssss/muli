import { useState, useEffect, useCallback, useMemo } from 'react'

export const useLocal = <T>(key: string, defaultValue: T) => {
  const value = useMemo(() => {
    const v = window.localStorage.getItem(key) ?? ''
    console.log({v})
    if (v && v !== 'undefined') {
      return JSON.parse(v) as T
    }
    return defaultValue
  }, [])

  const setValue = (v: T) => window.localStorage.setItem(key, JSON.stringify(v))

  return [value, setValue] as const
}
