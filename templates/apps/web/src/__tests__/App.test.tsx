import { render, screen } from '@testing-library/react'
import { AppProvider } from '../../app/providers/App'

jest.mock('../../app/trpc', () => {
  const actual = jest.requireActual('../../app/trpc')
  return {
    ...actual,
    trpc: {
      ...actual.trpc,
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      create: { useMutation: () => ({ mutate: () => {}, isLoading: false }) },
      useUtils: () => ({ list: { invalidate: () => Promise.resolve() } }),
      Provider: ({ children }: any) => children,
    },
    createClient: () => ({}),
  }
})

describe('App renders', () => {
  it('shows title', () => {
    render(<AppProvider />)
    expect(screen.getByText('__PROJECT_NAME__')).toBeInTheDocument()
  })
})


