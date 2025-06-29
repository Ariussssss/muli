import { useState, useEffect, useCallback } from 'react'
import { SERVER_HOST } from '../const'

export const useLog = () => {
  const log = useCallback((name: string, value = 1) => {
    fetch(`${SERVER_HOST}/api/log`, {
      method: 'POST',
      headers: {
	"content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        value,
      }),
    })
  }, [])
  return { log }
}
