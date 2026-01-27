import { Database } from '@/types/database.types'

type Person = Database['public']['Tables']['persons']['Row']
type Relationship = Database['public']['Tables']['relationships']['Row']

export function generateGedcom(persons: Person[], relationships: Relationship[]): string {
  const lines: string[] = []
  
  // Header
  lines.push('0 HEAD')
  lines.push('1 SOUR GLEAN_FAMILY_TREE')
  lines.push('1 GEDC')
  lines.push('2 VERS 5.5.1')
  lines.push('2 FORM LINEAGE-LINKED')
  lines.push('1 CHAR UTF-8')

  // Map to store Person ID -> GEDCOM ID
  const personIdMap = new Map<string, string>() // UUID -> @I1@
  
  // Individuals
  persons.forEach((p, index) => {
    const id = `@I${index + 1}@`
    personIdMap.set(p.id, id)
    
    lines.push(`0 ${id} INDI`)
    
    // Name
    const names = p.name.trim().split(' ')
    let givenName = p.name
    let surname = ''
    
    if (names.length > 0) {
      surname = names[names.length - 1]
      givenName = names.slice(0, names.length - 1).join(' ')
    }
    
    lines.push(`1 NAME ${givenName} /${surname}/`)
    
    // Nickname
    if (p.nickname) {
      lines.push(`1 NICK ${p.nickname}`)
    }
    
    // Gender
    if (p.gender) {
      lines.push(`1 SEX ${p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'U'}`)
    }
    
    // Birth
    if (p.date_of_birth || p.birth_place) {
      lines.push('1 BIRT')
      if (p.date_of_birth) lines.push(`2 DATE ${formatDate(p.date_of_birth)}`)
      if (p.birth_place) lines.push(`2 PLAC ${p.birth_place}`)
    }

    // Death
    if (p.death_place) {
       lines.push('1 DEAT')
       lines.push(`2 PLAC ${p.death_place}`)
    }
    
    // Occupation
    if (p.occupation) {
      lines.push(`1 OCCU ${p.occupation}`)
    }
    
    // Note
    if (p.notes) {
      lines.push(`1 NOTE ${p.notes.replace(/\n/g, ' ')}`)
    }
  })

  // Families
  type Family = {
    husb?: string
    wife?: string
    children: string[]
  }
  const families = new Map<string, Family>()

  // Helper to get or create family
  const getOrCreateFamily = (p1: string | undefined, p2: string | undefined): Family => {
    const ids = [p1, p2].filter(Boolean) as string[]
    const key = ids.sort().join('|')
    
    if (!families.has(key)) {
      let husb: string | undefined
      let wife: string | undefined
      
      // Try to assign roles based on gender
      const person1 = p1 ? persons.find(p => p.id === p1) : undefined
      const person2 = p2 ? persons.find(p => p.id === p2) : undefined
      
      if (person1?.gender === 'male') husb = p1
      else if (person1?.gender === 'female') wife = p1
      
      if (person2?.gender === 'male') husb = p2
      else if (person2?.gender === 'female') wife = p2
      
      // Fallback if genders are same or unknown
      if (!husb && !wife) {
        if (p1) husb = p1
        if (p2) wife = p2
      } else if (!husb) {
        if (p1 !== wife) husb = p1
        else if (p2 !== wife) husb = p2
      } else if (!wife) {
         if (p1 !== husb) wife = p1
         else if (p2 !== husb) wife = p2
      }
      
      families.set(key, { husb, wife, children: [] })
    }
    return families.get(key)!
  }

  // 1. Process Spouses
  relationships.filter(r => r.relationship_type === 'spouse').forEach(r => {
     getOrCreateFamily(r.parent_id, r.child_id)
  })

  // 2. Process Children
  // Group children by parents first
  const childToParents = new Map<string, string[]>()
  relationships.filter(r => r.relationship_type === 'parent-child').forEach(r => {
    const parents = childToParents.get(r.child_id) || []
    if (!parents.includes(r.parent_id)) {
        parents.push(r.parent_id)
    }
    childToParents.set(r.child_id, parents)
  })

  childToParents.forEach((parentIds, childId) => {
     if (parentIds.length === 0) return
     
     // Limit to 2 parents for standard GEDCOM FAM
     const p1 = parentIds[0]
     const p2 = parentIds[1]
     
     const fam = getOrCreateFamily(p1, p2)
     if (!fam.children.includes(childId)) {
       fam.children.push(childId)
     }
  })

  // Output FAM records
  let famIndex = 1
  families.forEach((fam) => {
     const id = `@F${famIndex++}@`
     lines.push(`0 ${id} FAM`)
     if (fam.husb) lines.push(`1 HUSB ${personIdMap.get(fam.husb)}`)
     if (fam.wife) lines.push(`1 WIFE ${personIdMap.get(fam.wife)}`)
     fam.children.forEach(childId => {
        lines.push(`1 CHIL ${personIdMap.get(childId)}`)
     })
  })

  lines.push('0 TRLR')
  return lines.join('\n')
}

export type ParsedGedcom = {
  persons: {
    id: string // GEDCOM ID (@I1@)
    name: string
    gender?: string
    birthDate?: string
    birthPlace?: string
    deathPlace?: string
    occupation?: string
    notes?: string
  }[]
  families: {
    id: string // GEDCOM ID (@F1@)
    husb?: string
    wife?: string
    children: string[]
  }[]
}

export function parseGedcom(content: string): ParsedGedcom {
  const lines = content.split('\n')
  const persons: ParsedGedcom['persons'] = []
  const families: ParsedGedcom['families'] = []

  let currentRecord: any = null
  let currentId = ''
  let currentType = ''
  let lastTag = ''

  lines.forEach(line => {
    const parts = line.trim().split(' ')
    const level = parts[0]
    
    // Check if it's a record start: 0 @ID@ TYPE
    if (level === '0' && parts[1].startsWith('@')) {
        if (currentRecord) {
            if (currentType === 'INDI') persons.push(currentRecord)
            else if (currentType === 'FAM') families.push(currentRecord)
        }
        
        currentId = parts[1]
        currentType = parts[2]
        currentRecord = { id: currentId }
        if (currentType === 'FAM') currentRecord.children = []
    } else if (currentRecord && level !== '0') {
        const tag = parts[1]
        const value = parts.slice(2).join(' ')
        
        if (currentType === 'INDI') {
            if (tag === 'NAME') currentRecord.name = value.replace(/\//g, '').trim()
            if (tag === 'SEX') currentRecord.gender = value === 'M' ? 'male' : value === 'F' ? 'female' : 'other'
            if (tag === 'BIRT') lastTag = 'BIRT'
            if (tag === 'DEAT') lastTag = 'DEAT'
            if (tag === 'DATE') {
                if (lastTag === 'BIRT') currentRecord.birthDate = value
                // if (lastTag === 'DEAT') currentRecord.deathDate = value
            }
            if (tag === 'PLAC') {
                if (lastTag === 'BIRT') currentRecord.birthPlace = value
                if (lastTag === 'DEAT') currentRecord.deathPlace = value
            }
            if (tag === 'OCCU') currentRecord.occupation = value
            if (tag === 'NOTE') currentRecord.notes = (currentRecord.notes || '') + value
            if (tag === 'NICK') currentRecord.nickname = value // Custom tag often used
        } else if (currentType === 'FAM') {
            if (tag === 'HUSB') currentRecord.husb = value
            if (tag === 'WIFE') currentRecord.wife = value
            if (tag === 'CHIL') currentRecord.children.push(value)
        }
    }
  })
  
  // Push last record
  if (currentRecord) {
        if (currentType === 'INDI') persons.push(currentRecord)
        else if (currentType === 'FAM') families.push(currentRecord)
  }

  return { persons, families }
}

export function parseGedcomDate(dateStr?: string): string | null {
  if (!dateStr) return null
  try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return null
      return date.toISOString().split('T')[0]
  } catch {
      return null
  }
}

function formatDate(dateStr: string): string {
  try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      
      const day = date.getDate()
      const month = date.toLocaleString('default', { month: 'short' }).toUpperCase()
      const year = date.getFullYear()
      return `${day} ${month} ${year}`
  } catch {
      return dateStr
  }
}
