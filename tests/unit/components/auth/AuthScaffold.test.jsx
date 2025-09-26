import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AuthScaffold from '../../../../src/components/auth/AuthScaffold.jsx'

describe('AuthScaffold', () => {
  it('renders headings, children, footer, and home link by default', () => {
    render(
      <MemoryRouter>
        <AuthScaffold heading="Welcome" subheading="Subheading" footer={<span>Footer text</span>}>
          <div>Inner content</div>
        </AuthScaffold>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByText('Subheading')).toBeInTheDocument()
    expect(screen.getByText('Inner content')).toBeInTheDocument()
    expect(screen.getByText('Footer text')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to homepage' })).toHaveAttribute('href', '/')
  })

  it('omits the home link when showHomeLink is false', () => {
    render(
      <MemoryRouter>
        <AuthScaffold heading="Heading" showHomeLink={false}>
          <div>Content</div>
        </AuthScaffold>
      </MemoryRouter>
    )

    expect(screen.queryByRole('link', { name: 'Back to homepage' })).not.toBeInTheDocument()
  })
})
