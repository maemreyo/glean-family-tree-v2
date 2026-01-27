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
}

export function ShareDialog({ userId }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: links, isLoading } = useSharedLinks(userId)
  const createLink = useCreateSharedLink()
  const deleteLink = useDeleteSharedLink()

  const handleCreateLink = async () => {
    try {
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      await createLink.mutateAsync({
        user_id: userId,
        token,
        is_active: true,
      })
      toast.success('Shared link created')
    } catch (error) {
      toast.error('Failed to create shared link')
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
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Family Tree</DialogTitle>
          <DialogDescription>
            Create a read-only link to share your family tree with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
