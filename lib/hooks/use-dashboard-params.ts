
import { useQueryState, parseAsString } from 'nuqs'

export function useDashboardParams() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q', 
    parseAsString.withDefault('').withOptions({
      history: 'replace',
      shallow: false, // Update server component props if needed, or true for client-only
      throttleMs: 500
    })
  )

  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsString.withDefault('tree').withOptions({
      history: 'push',
      shallow: true
    })
  )

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab
  }
}
