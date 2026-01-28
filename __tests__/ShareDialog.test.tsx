import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"
import { act } from "react"
import { ShareDialog } from '@/components/dashboard/FamilyTree/ShareDialog'

const useSharedLinksMock = jest.fn()
const useCreateSharedLinkMock = jest.fn()
const useDeleteSharedLinkMock = jest.fn()

jest.mock("@/lib/supabase/queries", () => ({
  useSharedLinks: () => useSharedLinksMock(),
  useCreateSharedLink: () => useCreateSharedLinkMock(),
  useDeleteSharedLink: () => useDeleteSharedLinkMock(),
}))

describe("ShareDialog", () => {
  it("creates an invite with email and role", async () => {
    const mutateAsync = jest.fn().mockResolvedValue({})

    useSharedLinksMock.mockReturnValue({ data: [], isLoading: false })
    useCreateSharedLinkMock.mockReturnValue({ mutateAsync, isPending: false })
    useDeleteSharedLinkMock.mockReturnValue({ mutateAsync: jest.fn(), isPending: false })

    render(<ShareDialog userId="user-123" />)

    fireEvent.click(screen.getByRole("button", { name: /share/i }))

    fireEvent.change(screen.getByLabelText(/invite email/i), {
      target: { value: "someone@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: "editor" },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send invite/i }))
    })

    expect(mutateAsync).toHaveBeenCalledWith({
      user_id: "user-123",
      token: expect.any(String),
      is_active: true,
      role: "editor",
      invited_email: "someone@example.com",
    })
  })
})
