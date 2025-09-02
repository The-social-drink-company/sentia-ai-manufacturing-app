import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

function Dashboard() {
  const { getToken } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = await getToken()
      const response = await axios.get('/api/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setData(response.data)
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="dashboard">
      <h1>Manufacturing Dashboard</h1>
      <p>Authenticated React frontend with Flask API backend</p>
      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  )
}

export default Dashboard