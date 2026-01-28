import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotoGallery } from '@/components/PhotoGallery'
import { usePersonPhotos, useLifeEvents, useUploadPhoto, useUpdatePhoto, useDeletePhoto } from '@/lib/supabase/queries'

// Mock the hooks
jest.mock('@/lib/supabase/queries', () => ({
  usePersonPhotos: jest.fn(),
  useLifeEvents: jest.fn(),
  useUploadPhoto: jest.fn(),
  useUpdatePhoto: jest.fn(),
  useDeletePhoto: jest.fn(),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

// Mock PhotoDetailDialog to avoid testing its internal logic here, 
// but we want to test interaction, so maybe we shouldn't mock it entirely.
// However, since it's a separate component, let's just assume it works and test that PhotoGallery renders correctly.
// But wait, PhotoGallery uses PhotoDetailDialog directly.
// To test integration, we can leave it unmocked.
// But Radix UI Dialog might be tricky in JSDOM. 
// Let's try to mock the Dialog parts if needed, or just test the grouping logic first.

const mockPhotos = [
  { id: 'p1', url: '/p1.jpg', description: 'Photo 1', life_event_id: null, person_id: 'person-1' },
  { id: 'p2', url: '/p2.jpg', description: 'Wedding Photo', life_event_id: 'e1', person_id: 'person-1' },
  { id: 'p3', url: '/p3.jpg', description: 'Birthday Photo', life_event_id: 'e2', person_id: 'person-1' },
]

const mockEvents = [
  { id: 'e1', title: 'Wedding', date: '2020-01-01', event_type: 'marriage' },
  { id: 'e2', title: 'Birthday', date: '2021-01-01', event_type: 'birth' },
]

describe('PhotoGallery', () => {
  const usePersonPhotosMock = usePersonPhotos as jest.Mock
  const useLifeEventsMock = useLifeEvents as jest.Mock
  const useUploadPhotoMock = useUploadPhoto as jest.Mock
  const useUpdatePhotoMock = useUpdatePhoto as jest.Mock
  const useDeletePhotoMock = useDeletePhoto as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    usePersonPhotosMock.mockReturnValue({
      data: mockPhotos,
      isLoading: false,
    })

    useLifeEventsMock.mockReturnValue({
      data: mockEvents,
      isLoading: false,
    })

    useUploadPhotoMock.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    })

    useUpdatePhotoMock.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    })

    useDeletePhotoMock.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    })
  })

  it('renders photos grouped by event', () => {
    render(<PhotoGallery personId="person-1" userId="user-1" />)

    // Check headers
    expect(screen.getByText('General Photos')).toBeInTheDocument()
    expect(screen.getByText('Wedding')).toBeInTheDocument()
    expect(screen.getByText('Birthday')).toBeInTheDocument()

    // Check photos
    // Note: Since we mocked Image as img, we can look for alt text
    expect(screen.getByAltText('Photo 1')).toBeInTheDocument()
    expect(screen.getByAltText('Wedding Photo')).toBeInTheDocument()
    expect(screen.getByAltText('Birthday Photo')).toBeInTheDocument()
  })

  it('renders "No photos yet" when there are no photos', () => {
    usePersonPhotosMock.mockReturnValue({
      data: [],
      isLoading: false,
    })

    render(<PhotoGallery personId="person-1" userId="user-1" />)
    expect(screen.getByText('No photos yet')).toBeInTheDocument()
  })
  
  it('opens dialog when photo is clicked', async () => {
     render(<PhotoGallery personId="person-1" userId="user-1" />)
     
     const photo = screen.getByAltText('Photo 1')
     fireEvent.click(photo)
     
     // Dialog title should appear
     expect(await screen.findByText('Photo Details')).toBeInTheDocument()
     // Check if description input is populated
     expect(screen.getByDisplayValue('Photo 1')).toBeInTheDocument()
  })
})
