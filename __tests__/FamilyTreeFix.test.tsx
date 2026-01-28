
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import { FamilyTree } from '@/components/FamilyTree'

// --- Mock Factories ---

const createPerson = (id: string, name: string, overrides = {}) => ({
  id,
  first_name: name,
  last_name: 'Doe',
  birth_year: 1980,
  gender: 'male',
  ...overrides,
})

const createRelationship = (id: string, person1Id: string, person2Id: string) => ({
  id,
  person1_id: person1Id,
  person2_id: person2Id,
  relationship_type: 'parent_child',
})

// --- Mocks Setup ---

// 1. Mock useRelationships hook to control data
let mockRelationships: any[] = []
const mockUseRelationships = jest.fn(() => ({ data: mockRelationships }))

// 2. Mock useUpdatePerson
const mockUpdatePerson = jest.fn()
const mockUseUpdatePerson = jest.fn(() => ({ mutate: mockUpdatePerson }))

jest.mock('@/lib/supabase/queries', () => ({
  useRelationships: () => mockUseRelationships(),
  useUpdatePerson: () => mockUseUpdatePerson(),
}))

// 3. Mock ReactFlow hooks
const mockSetNodes = jest.fn()
const mockSetEdges = jest.fn()
const mockGetNodes = jest.fn(() => [])

jest.mock('reactflow', () => {
  return {
    __esModule: true,
    default: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
    ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
    ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>,
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
    useNodesState: jest.fn((initial) => [initial, mockSetNodes, jest.fn()]),
    useEdgesState: jest.fn((initial) => [initial, mockSetEdges, jest.fn()]),
    useReactFlow: () => ({
      fitView: jest.fn(),
      project: jest.fn(),
      getNodes: mockGetNodes,
      setNodes: mockSetNodes,
      setEdges: mockSetEdges,
    }),
    addEdge: jest.fn(),
    MarkerType: { ArrowClosed: 'arrowclosed' },
    Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
    getRectOfNodes: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    getTransformForBounds: jest.fn(() => [1, 0, 0]),
  }
})

// 4. Mock other dependencies
jest.mock('@/components/FamilyTree/PersonNode', () => ({
  PersonNode: () => <div data-testid="person-node" />
}))

jest.mock('@/components/FamilyTree/ShareDialog', () => ({
  ShareDialog: () => <div data-testid="share-dialog" />
}))

jest.mock('dagre', () => ({
  graphlib: {
    Graph: jest.fn().mockImplementation(() => ({
      setGraph: jest.fn(),
      setDefaultEdgeLabel: jest.fn(),
      setNode: jest.fn(),
      setEdge: jest.fn(),
      nodes: jest.fn().mockReturnValue([]),
      edges: jest.fn().mockReturnValue([]),
      node: jest.fn().mockReturnValue({ width: 100, height: 100, x: 0, y: 0 }),
    })),
  },
  layout: jest.fn(),
}))

jest.mock('@/providers/ui-store-provider', () => ({
  useUIStore: jest.fn().mockReturnValue({
    searchQuery: '',
    setSearchQuery: jest.fn(),
  }),
}))

jest.mock('html-to-image', () => ({
  toPng: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  })),
}))

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// --- Tests ---

describe('FamilyTree Smart Sync Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRelationships = []
    // Reset mockSetNodes implementation
    mockSetNodes.mockReset()
  })

  it('Scenario 1: Node Position Persistence - Data update should NOT reset positions', async () => {
    const person1 = createPerson('1', 'John')
    const person2 = createPerson('2', 'Jane')
    const initialPersons = [person1, person2]

    // 1. Initial Render
    const { rerender } = render(
      <ReactFlowProvider>
        <FamilyTree userId="user1" persons={initialPersons as any} />
      </ReactFlowProvider>
    )

    // Expect initial setNodes to be called with array (layouted nodes)
    expect(mockSetNodes).toHaveBeenCalled()
    // Capture the first call argument (the initial layout)
    const initialCall = mockSetNodes.mock.calls[0][0]
    expect(Array.isArray(initialCall)).toBe(true)

    console.log('Test 1: Initial render complete')
    mockSetNodes.mockClear()

    // 2. Simulate User Drag (update internal node state mock)
    // We can't easily simulate the internal state update of useNodesState from here
    // But we can simulate the prop change and check how setNodes is called.
    
    // Update person name (Data Change)
    const updatedPerson1 = { ...person1, first_name: 'Johnny' }
    const updatedPersons = [updatedPerson1, person2]

    rerender(
      <ReactFlowProvider>
        <FamilyTree userId="user1" persons={updatedPersons as any} />
      </ReactFlowProvider>
    )

    // Expect setNodes to be called with a FUNCTION updater, NOT an array
    // This confirms it's using the setNodes(nodes => ...) pattern for data updates
    // instead of setNodes(layoutedNodes) which would reset positions
    expect(mockSetNodes).toHaveBeenCalledTimes(1)
    const updateCall = mockSetNodes.mock.calls[0][0]
    expect(typeof updateCall).toBe('function')
    console.log('Test 1: Data update triggered functional update (preserved positions)')
  })

  it('Scenario 2: Structural Change - Adding Person should trigger layout update', async () => {
    const person1 = createPerson('1', 'John')
    const initialPersons = [person1]

    // 1. Initial Render
    const { rerender } = render(
      <ReactFlowProvider>
        <FamilyTree userId="user1" persons={initialPersons as any} />
      </ReactFlowProvider>
    )

    mockSetNodes.mockClear()

    // 2. Add new person
    const person2 = createPerson('2', 'Jane')
    const updatedPersons = [person1, person2]

    rerender(
      <ReactFlowProvider>
        <FamilyTree userId="user1" persons={updatedPersons as any} />
      </ReactFlowProvider>
    )

    // Expect setNodes to be called with an ARRAY (new layout) because structure changed
    expect(mockSetNodes).toHaveBeenCalled()
    const updateCall = mockSetNodes.mock.calls[0][0]
    expect(Array.isArray(updateCall)).toBe(true)
    expect(updateCall.length).toBe(2)
    console.log('Test 2: Structural addition triggered layout update')
  })

  it('Scenario 3: Structural Change - Removing Person should trigger layout update', async () => {
    const person1 = createPerson('1', 'John')
    const person2 = createPerson('2', 'Jane')
    const initialPersons = [person1, person2]

    // 1. Initial Render
    const { rerender } = render(
      <ReactFlowProvider>
        <FamilyTree userId="user1" persons={initialPersons as any} />
      </ReactFlowProvider>
    )

    mockSetNodes.mockClear()

    // 2. Remove person
    const updatedPersons = [person1]

    rerender(
      <ReactFlowProvider>
        <FamilyTree userId="user1" persons={updatedPersons as any} />
      </ReactFlowProvider>
    )

    // Expect setNodes to be called with an ARRAY (new layout)
    expect(mockSetNodes).toHaveBeenCalled()
    const updateCall = mockSetNodes.mock.calls[0][0]
    expect(Array.isArray(updateCall)).toBe(true)
    expect(updateCall.length).toBe(1)
    console.log('Test 3: Structural removal triggered layout update')
  })
})
