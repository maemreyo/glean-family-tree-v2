
import type { Database } from '@/types/database.types'

type Relationship = Database['public']['Tables']['relationships']['Row']

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

  constructor(relationships: Relationship[]) {
    this.relationships = relationships
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
        r.child_id === childId
    )

    if (existingRelationship) {
      return {
        valid: false,
        error: 'This parent-child relationship already exists',
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
   * @deprecated Spouse relationships are not yet supported in the database schema
   */
  validateSpouse(person1Id: string, person2Id: string): ValidationResult {
    return {
        valid: false,
        error: 'Spouse relationships are not currently supported by the database schema.'
    }
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
          (r) => r.child_id === current
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
          (r) => r.parent_id === current
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
