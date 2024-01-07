import { useState, useEffect } from 'react'

const useLocalStorage = (key: string, defaultValue: string) => {
  const [value, setValue] = useState(() => {
    let currentValue
    try {
      const item = localStorage.getItem(key)
      currentValue = item ? JSON.parse(item) : JSON.parse(defaultValue)
    } catch (error) {
      currentValue = JSON.parse(defaultValue)
    }
    return currentValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [value, key])

  return [value, setValue]
}

export default useLocalStorage
