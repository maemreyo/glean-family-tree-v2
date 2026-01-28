import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"
import { act } from "react"
import { LifeEventTimeline } from "@/components/LifeEventTimeline"

const useLifeEventsMock = jest.fn()
const useCreateLifeEventMock = jest.fn()
const useDeleteLifeEventMock = jest.fn()

jest.mock("@/lib/supabase/queries", () => ({
  useLifeEvents: () => useLifeEventsMock(),
  useCreateLifeEvent: () => useCreateLifeEventMock(),
  useDeleteLifeEvent: () => useDeleteLifeEventMock(),
}))

describe("LifeEventTimeline", () => {
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
        confidence_level: "speculative",
        source_url: "https://example.com",
        source_notes: "Family story",
      }),
      expect.any(Object)
    )
  })
})
