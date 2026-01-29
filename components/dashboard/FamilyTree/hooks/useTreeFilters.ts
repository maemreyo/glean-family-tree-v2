import { useMemo } from 'react'
import { useUIStore } from '@/providers/ui-store-provider'
import { PersonWithPhoto } from '@/types/app'
import type { Database } from '@/types/database.types'

type Relationship = Database['public']['Tables']['relationships']['Row']

export function useTreeFilters(persons: PersonWithPhoto[], relationships: Relationship[]) {
  const treeFilters = useUIStore((state) => state.treeFilters)

  const relationshipIndex = useMemo(() => {
    const index = new Map<string, { isParent: boolean; isChild: boolean; isSpouse: boolean }>()
    persons.forEach((person) => {
      index.set(person.id, { isParent: false, isChild: false, isSpouse: false })
    })
    relationships.forEach((rel) => {
      if (!index.has(rel.from_person_id)) {
        index.set(rel.from_person_id, { isParent: false, isChild: false, isSpouse: false })
      }
      if (!index.has(rel.to_person_id)) {
        index.set(rel.to_person_id, { isParent: false, isChild: false, isSpouse: false })
      }
      if (rel.type === 'parent') {
        index.get(rel.from_person_id)!.isParent = true
        index.get(rel.to_person_id)!.isChild = true
      }
      if (rel.type === 'spouse') {
        index.get(rel.from_person_id)!.isSpouse = true
        index.get(rel.to_person_id)!.isSpouse = true
      }
    })
    return index
  }, [persons, relationships])

  const filteredPersons = useMemo(() => {
    const normalize = (value: string | null | undefined) => value?.toLowerCase().trim() ?? ''
    const minYearRaw = treeFilters.birthYear.min.trim()
    const maxYearRaw = treeFilters.birthYear.max.trim()
    const minYear = minYearRaw ? Number(minYearRaw) : null
    const maxYear = maxYearRaw ? Number(maxYearRaw) : null
    const hasMinYear = minYear !== null && Number.isFinite(minYear)
    const hasMaxYear = maxYear !== null && Number.isFinite(maxYear)
    const keyword = normalize(treeFilters.keyword)
    const birthPlace = normalize(treeFilters.birthPlace)
    const deathPlace = normalize(treeFilters.deathPlace)
    const occupation = normalize(treeFilters.occupation)
    const tagTokens = treeFilters.tags
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
    const relationshipFilters = treeFilters.relationships
    const isAllRelationshipsSelected =
      relationshipFilters.parent &&
      relationshipFilters.child &&
      relationshipFilters.spouse
    const hasAnyRelationshipFilter =
      relationshipFilters.parent ||
      relationshipFilters.child ||
      relationshipFilters.spouse

    return persons.filter((person) => {
      const genderValue = normalize(person.gender)
      // Translate Vietnamese gender values if they exist in DB, but for code consistency we check both
      const genderKey =
        !genderValue
          ? 'unknown'
          : genderValue === 'male' || genderValue === 'm' || genderValue === 'nam'
            ? 'male'
            : genderValue === 'female' || genderValue === 'f' || genderValue === 'nu' || genderValue === 'nữ'
              ? 'female'
              : 'other'
      if (!treeFilters.gender[genderKey as keyof typeof treeFilters.gender]) return false

      const statusKey =
        person.is_deceased === true
          ? 'deceased'
          : person.is_deceased === false
            ? 'living'
            : 'unknown'
      if (!treeFilters.status[statusKey as keyof typeof treeFilters.status]) return false

      if (hasMinYear || hasMaxYear) {
        const birthYearMatch = person.date_of_birth?.match(/\d{4}/)
        const birthYear = birthYearMatch ? Number(birthYearMatch[0]) : null
        if (hasMinYear && (birthYear === null || birthYear < minYear)) return false
        if (hasMaxYear && (birthYear === null || birthYear > maxYear)) return false
      }

      if (treeFilters.hasPhoto && (!person.person_photos || person.person_photos.length === 0)) {
        return false
      }
      if (treeFilters.hasBiography && !person.biography?.trim()) {
        return false
      }

      if (birthPlace && !normalize(person.birth_place).includes(birthPlace)) return false
      if (deathPlace && !normalize(person.death_place).includes(deathPlace)) return false
      if (occupation && !normalize(person.occupation).includes(occupation)) return false

      if (keyword) {
        const keywordSource = [
          person.name,
          person.nickname,
          person.biography,
          person.notes,
          person.source_notes,
          person.birth_place,
          person.death_place,
          person.occupation,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!keywordSource.includes(keyword)) return false
      }

      if (tagTokens.length > 0) {
        const tagSource = [person.notes, person.source_notes, person.biography]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        const tagsMatch = tagTokens.every((token) => tagSource.includes(token))
        if (!tagsMatch) return false
      }

      if (!isAllRelationshipsSelected) {
        if (!hasAnyRelationshipFilter) return false
        const flags = relationshipIndex.get(person.id) ?? {
          isParent: false,
          isChild: false,
          isSpouse: false,
        }
        const matchesRelationship =
          (relationshipFilters.parent && flags.isParent) ||
          (relationshipFilters.child && flags.isChild) ||
          (relationshipFilters.spouse && flags.isSpouse)
        if (!matchesRelationship) return false
      }

      return true
    })
  }, [persons, relationshipIndex, treeFilters])

  const filteredRelationships = useMemo(() => {
    const allowedPersonIds = new Set(filteredPersons.map((person) => person.id))
    const allowParentEdges =
      treeFilters.relationships.parent || treeFilters.relationships.child
    return relationships.filter((rel) => {
      if (!allowedPersonIds.has(rel.from_person_id) || !allowedPersonIds.has(rel.to_person_id)) {
        return false
      }
      if (rel.type === 'spouse') return treeFilters.relationships.spouse
      if (rel.type === 'parent') return allowParentEdges
      return true
    })
  }, [filteredPersons, relationships, treeFilters.relationships])

  return {
    filteredPersons,
    filteredRelationships,
  }
}
