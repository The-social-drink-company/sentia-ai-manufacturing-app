import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../../src/App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })

  it('contains the main application structure', () => {
    render(<App />)
    // Add more specific tests based on your App component structure
    // For example:
    // expect(screen.getByRole('main')).toBeInTheDocument()
  })
})