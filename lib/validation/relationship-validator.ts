
import type { Database } from '@/types/database.types'

type Relationship = Database['public']['Tables']['relationships']['Row']
type Person = Database['public']['Tables']['persons']['Row']

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates relationship creation to prevent circular dependencies
 * and other logical errors
 */
export class RelationshipValidator {
  private relationships: Relationship[]
  private persons: Person[]

  constructor(relationships: Relationship[], persons: Person[] = []) {
    this.relationships = relationships
    this.persons = persons
  }

  /**
   * Validate parent-child relationship
   */
  validateParentChild(parentId: string, childId: string): ValidationResult {
    // Check if same person
    if (parentId === childId) {
      return {
        valid: false,
        error: 'A person cannot be their own parent',
      }
    }

    // Check if relationship already exists
    const existingRelationship = this.relationships.find(
      (r) =>
        r.parent_id === parentId &&
        r.child_id === childId &&
        r.relationship_type === 'parent'
    )

    if (existingRelationship) {
      return {
        valid: false,
        error: 'This parent-child relationship already exists',
      }
    }

    // Birth date validation
    const parent = this.persons.find((p) => p.id === parentId)
    const child = this.persons.find((p) => p.id === childId)

    if (parent?.date_of_birth && child?.date_of_birth) {
      const parentDob = new Date(parent.date_of_birth)
      const childDob = new Date(child.date_of_birth)

      if (parentDob >= childDob) {
        return {
          valid: false,
          error: 'Parent cannot be younger than or same age as child',
        }
      }
    }

    // Check if child is ancestor of parent (would create circular dependency)
    const ancestors = this.getAncestors(parentId)
    if (ancestors.includes(childId)) {
      return {
        valid: false,
        error: 'Cannot create this relationship: it would create a circular family tree',
      }
    }

    // Check if parent is descendant of child
    const descendants = this.getDescendants(childId)
    if (descendants.includes(parentId)) {
      return {
        valid: false,
        error: 'Cannot create this relationship: it would create a circular family tree',
      }
    }

    return { valid: true }
  }

  /**
   * Validate spouse relationship
   */
  validateSpouse(person1Id: string, person2Id: string): ValidationResult {
    if (person1Id === person2Id) {
      return {
        valid: false,
        error: 'Cannot create relationship with same person',
      }
    }

    // Check if relationship already exists (in either direction)
    const existingRelationship = this.relationships.find(
      (r) =>
        r.relationship_type === 'spouse' &&
        ((r.parent_id === person1Id && r.child_id === person2Id) ||
          (r.parent_id === person2Id && r.child_id === person1Id))
    )

    if (existingRelationship) {
      return {
        valid: false,
        error: 'This spouse relationship already exists',
      }
    }

    return { valid: true }
  }

  /**
   * Get all ancestors of a person (parents, grandparents, etc.)
   */
  private getAncestors(personId: string): string[] {
    const ancestors = new Set<string>()
    const queue = [personId]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()!

      if (visited.has(current)) continue
      visited.add(current)

      const parents = this.relationships
        .filter(
          (r) => r.child_id === current && r.relationship_type === 'parent'
        )
        .map((r) => r.parent_id)

      parents.forEach((parentId) => {
        ancestors.add(parentId)
        queue.push(parentId)
      })
    }

    return Array.from(ancestors)
  }

  /**
   * Get all descendants of a person (children, grandchildren, etc.)
   */
  private getDescendants(personId: string): string[] {
    const descendants = new Set<string>()
    const queue = [personId]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()!

      if (visited.has(current)) continue
      visited.add(current)

      const children = this.relationships
        .filter(
          (r) => r.parent_id === current && r.relationship_type === 'parent'
        )
        .map((r) => r.child_id)

      children.forEach((childId) => {
        descendants.add(childId)
        queue.push(childId)
      })
    }

    return Array.from(descendants)
  }
}
