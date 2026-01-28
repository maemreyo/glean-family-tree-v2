import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"
import { act } from "react"
import { LifeEventTimeline } from "@/components/LifeEventTimeline"

const useLifeEventsMock = jest.fn()
const useCreateLifeEventMock = jest.fn()
const useDeleteLifeEventMock = jest.fn()
const usePersonPhotosMock = jest.fn()
const useUploadPhotoMock = jest.fn()

jest.mock("@/lib/supabase/queries", () => ({
  useLifeEvents: () => useLifeEventsMock(),
  useCreateLifeEvent: () => useCreateLifeEventMock(),
  useDeleteLifeEvent: () => useDeleteLifeEventMock(),
  usePersonPhotos: () => usePersonPhotosMock(),
  useUploadPhoto: () => useUploadPhotoMock(),
}))

describe("LifeEventTimeline", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePersonPhotosMock.mockReturnValue({ data: [], isLoading: false })
    useUploadPhotoMock.mockReturnValue({ mutate: jest.fn(), isPending: false })
  })

  it("submits confidence and source fields for new events", async () => {
    const mutate = jest.fn()

    useLifeEventsMock.mockReturnValue({ data: [], isLoading: false })
    useCreateLifeEventMock.mockReturnValue({ mutate, isPending: false })
    useDeleteLifeEventMock.mockReturnValue({ mutate: jest.fn(), isPending: false })

    render(<LifeEventTimeline personId="person-1" userId="user-1" />)

    fireEvent.click(screen.getByRole("button", { name: /add event/i }))

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Graduated" },
    })
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: "story" },
    })
    fireEvent.change(screen.getByLabelText(/confidence level/i), {
      target: { value: "speculative" },
    })
    fireEvent.change(screen.getByLabelText(/source url/i), {
      target: { value: "https://example.com" },
    })
    fireEvent.change(screen.getByLabelText(/source notes/i), {
      target: { value: "Family story" },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save event/i }))
    })

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        person_id: "person-1",
        user_id: "user-1",
        title: "Graduated",
        event_type: "story",
        confidence_level: "speculative",
        source_url: "https://example.com",
        source_notes: "Family story",
      }),
      expect.any(Object)
    )
  })

  it("allows selecting 'story' event type and displays it", async () => {
    const mutate = jest.fn()

    useLifeEventsMock.mockReturnValue({
      data: [
        {
          id: "e1",
          person_id: "person-1",
          user_id: "user-1",
          title: "Grandfather’s Tale",
          description: "A beloved family tale",
          location: null,
          date: null,
          event_type: "story",
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    })
    useCreateLifeEventMock.mockReturnValue({ mutate, isPending: false })
    useDeleteLifeEventMock.mockReturnValue({ mutate: jest.fn(), isPending: false })

    render(<LifeEventTimeline personId="person-1" userId="user-1" />)

    expect(screen.getByText(/Grandfather’s Tale/i)).toBeInTheDocument()
    expect(screen.getByText(/A beloved family tale/i)).toBeInTheDocument()
    // Check for Type label and value separately to avoid whitespace/nesting issues
    expect(screen.getByText(/Type:/i)).toBeInTheDocument()
    expect(screen.getByText("story", { selector: "span" })).toBeInTheDocument()
  })

  it("allows selecting 'tradition' event type and displays it", async () => {
    const mutate = jest.fn()

    useLifeEventsMock.mockReturnValue({
      data: [
        {
          id: "e2",
          person_id: "person-1",
          user_id: "user-1",
          title: "Annual Family Reunion",
          description: "We meet every summer at the lake",
          location: "Lake House",
          date: null,
          event_type: "tradition",
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    })
    useCreateLifeEventMock.mockReturnValue({ mutate, isPending: false })
    useDeleteLifeEventMock.mockReturnValue({ mutate: jest.fn(), isPending: false })

    render(<LifeEventTimeline personId="person-1" userId="user-1" />)

    expect(screen.getByText(/Annual Family Reunion/i)).toBeInTheDocument()
    expect(screen.getByText(/We meet every summer at the lake/i)).toBeInTheDocument()
    expect(screen.getByText(/Type:/i)).toBeInTheDocument()
    expect(screen.getByText("tradition", { selector: "span" })).toBeInTheDocument()
  })

  it("displays photos associated with an event", async () => {
    useLifeEventsMock.mockReturnValue({
      data: [
        {
          id: "e3",
          person_id: "person-1",
          user_id: "user-1",
          title: "Wedding",
          event_type: "marriage",
          created_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
    })
    
    usePersonPhotosMock.mockReturnValue({
      data: [
        {
          id: "p1",
          url: "http://example.com/wedding.jpg",
          life_event_id: "e3",
          person_id: "person-1",
        },
        {
          id: "p2",
          url: "http://example.com/other.jpg",
          life_event_id: "other-event",
          person_id: "person-1",
        }
      ],
      isLoading: false
    })

    render(<LifeEventTimeline personId="person-1" userId="user-1" />)

    expect(screen.getByText("Wedding")).toBeInTheDocument()
    // Should see the wedding photo
    const weddingPhoto = screen.getByRole('img', { name: /photo associated with wedding/i })
    expect(weddingPhoto).toBeInTheDocument()
    expect(weddingPhoto).toHaveAttribute('src', expect.stringContaining('wedding.jpg'))
    
    // Should NOT see the other photo
    expect(screen.queryByRole('img', { name: /photo associated with other/i })).not.toBeInTheDocument()
  })
})
