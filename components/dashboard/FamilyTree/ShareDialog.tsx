'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useSharedLinks,
  useCreateSharedLink,
  useDeleteSharedLink,
} from '@/lib/supabase/queries'
import { Copy, Plus, Trash2, Share2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ShareDialogProps {
  userId: string
  trigger?: React.ReactNode
}

export function ShareDialog({ userId, trigger }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer')
  const { data: links, isLoading } = useSharedLinks(userId)
  const createLink = useCreateSharedLink()
  const deleteLink = useDeleteSharedLink()
  const selectClassName =
    'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

  const handleCreateLink = async () => {
    try {
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      await createLink.mutateAsync({
        user_id: userId,
        token,
        is_active: true,
        role: 'viewer',
      })
      toast.success('Shared link created')
    } catch (error) {
      toast.error('Failed to create shared link')
      console.error(error)
    }
  }

  const handleInvite = async () => {
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      await createLink.mutateAsync({
        user_id: userId,
        token,
        is_active: true,
        role: inviteRole,
        invited_email: invitedEmail.trim(),
      })
      setInvitedEmail('')
      toast.success('Invite sent')
    } catch (error) {
      toast.error('Failed to send invite')
      console.error(error)
    }
  }

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteLink.mutateAsync({ id, userId })
      toast.success('Shared link deleted')
    } catch (error) {
      toast.error('Failed to delete shared link')
      console.error(error)
    }
  }

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Family Tree</DialogTitle>
          <DialogDescription>
            Create a read-only link to share your family tree with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Invite Collaborator</h4>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Invite Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={invitedEmail}
                onChange={(event) => setInvitedEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className={selectClassName}
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as 'viewer' | 'editor')
                }
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={createLink.isPending || !invitedEmail.trim()}
              size="sm"
            >
              {createLink.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send Invite
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Active Links</h4>
            <Button
              onClick={handleCreateLink}
              disabled={createLink.isPending}
              size="sm"
            >
              {createLink.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Link
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : links && links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1 overflow-hidden mr-4">
                    <p className="text-sm font-medium truncate">
                      {window.location.origin}/share/{link.token}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(link.created_at), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(link.token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteLink(link.id)}
                      disabled={deleteLink.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No shared links created yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
