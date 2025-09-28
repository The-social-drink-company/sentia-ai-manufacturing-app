import { useEffect, useState } from 'react'

const phrases = ['Loading dashboards', 'Syncing metrics', 'Preparing insights']

const MultiStageLoader = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((value) => (value + 1) % phrases.length), 1600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-10 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-sm text-muted-foreground">{phrases[index]}</p>
    </div>
  )
}

export default MultiStageLoader
