import { SERVER_HOST } from '../const'
import { useState, useEffect, useCallback, useRef } from 'react'
import io, { Socket } from 'socket.io-client'

export const useSocket = ({
  device,
  jobs,
}: {
  device: string
  jobs: Map<string, () => void>
}) => {
  const socketRef = useRef<Socket>(null)
  const heartbeatInterval = useRef<NodeJS.Timeout>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!device) return
    // Replace with your server URL
    const newSocket = io(`${SERVER_HOST}`, {
      transports: ['websocket', 'polling'], // Explicitly set transports
      upgrade: true,
      forceNew: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = newSocket

    heartbeatInterval.current = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('heartbeat')
      }
    }, 20000) // Send every 20 seconds

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to server')

      // Register device with the server
      newSocket.emit('register_device', { device_id: device })
    })

    newSocket.on('connection_ack', (data) => {
      console.log('Connection acknowledged:', data)
    })

    newSocket.on('registration_success', (data) => {
      console.log('Device registration success:', data)
    })
    
    return () => {
      clearInterval(heartbeatInterval)
    }
  }, [])

  const heartbeat = () => {
    socketRef.current.emit('heartbeat')
  }
  return {
    heartbeat,
    socketRef
  }
}
