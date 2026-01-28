import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"
import { act } from "react"
import { PersonMetadataForm } from "@/components/PersonMetadataForm"

const useUpdatePersonMock = jest.fn()

jest.mock("@/lib/supabase/queries", () => ({
  useUpdatePerson: () => useUpdatePersonMock(),
}))

beforeAll(() => {
  if (!global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

describe("PersonMetadataForm", () => {
  it("submits visibility toggle state", async () => {
    const mutate = jest.fn()
    useUpdatePersonMock.mockReturnValue({ mutate, isPending: false })

    render(
      <PersonMetadataForm
        person={{
          id: "person-1",
          name: "Test Person",
          gender: null,
          date_of_birth: null,
          is_deceased: false,
          date_of_death: null,
          nickname: null,
          birth_place: null,
          death_place: null,
          occupation: null,
          biography: null,
          notes: null,
          position_x: null,
          position_y: null,
          family_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: "user-1",
          is_visible_in_share: true,
        } as any}
      />
    )

    const checkbox = screen.getByLabelText(/visible in shared links/i)
    await act(async () => {
      fireEvent.click(checkbox)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    })

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "person-1",
        is_visible_in_share: false,
      }),
      expect.any(Object)
    )
  })
})
