import { useCallback } from 'react'
import { Node, ReactFlowInstance, getRectOfNodes, getTransformForBounds } from 'reactflow'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import { PersonWithPhoto } from '@/types/app'
import { Database } from '@/types/database.types'
import { generateGedcom } from '@/lib/gedcom'
import { createClient } from '@/lib/supabase/client'

type Relationship = Database['public']['Tables']['relationships']['Row']

interface UseFamilyTreeExportProps {
  persons: PersonWithPhoto[]
  relationships: Relationship[]
  nodes: Node[]
  rfInstance: ReactFlowInstance | null
  userId: string
}

export function useFamilyTreeExport({
  persons,
  relationships,
  nodes,
  rfInstance,
  userId,
}: UseFamilyTreeExportProps) {
  const supabase = createClient()

  const onExport = useCallback(() => {
    if (!rfInstance) return

    const nodesBounds = getRectOfNodes(nodes)
    const transform = getTransformForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2
    )

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewport) return

    toPng(viewport, {
      backgroundColor: '#fff',
      width: nodesBounds.width,
      height: nodesBounds.height,
      style: {
        width: `${nodesBounds.width}px`,
        height: `${nodesBounds.height}px`,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = 'glean-family-tree.png'
      link.href = dataUrl
      link.click()
    })
  }, [rfInstance, nodes])

  const onExportGedcom = useCallback(() => {
    const gedcomContent = generateGedcom(persons, relationships)
    const blob = new Blob([gedcomContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'glean-family-tree.ged'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [persons, relationships])

  const onExportJson = useCallback(async () => {
    const loadingToast = toast.loading('Preparing JSON backup...')

    try {
      const [personsResult, relationshipsResult, photosResult, eventsResult] = await Promise.all([
        supabase.from('persons').select('*').eq('user_id', userId),
        supabase.from('relationships').select('*').eq('user_id', userId),
        supabase.from('person_photos').select('*').eq('user_id', userId),
        supabase.from('life_events').select('*').eq('user_id', userId),
      ])

      if (personsResult.error) throw personsResult.error
      if (relationshipsResult.error) throw relationshipsResult.error
      if (photosResult.error) throw photosResult.error
      if (eventsResult.error) throw eventsResult.error

      const payload = {
        version: 1,
        exported_at: new Date().toISOString(),
        persons: personsResult.data ?? [],
        relationships: relationshipsResult.data ?? [],
        person_photos: photosResult.data ?? [],
        life_events: eventsResult.data ?? [],
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `glean-family-tree-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      toast.dismiss(loadingToast)
      toast.success('JSON backup downloaded')
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error('Backup Failed: ' + error.message)
    }
  }, [supabase, userId])

  return {
    onExport,
    onExportGedcom,
    onExportJson,
  }
}
