// lib/validation/relationship-validator.ts

import type { Relationship } from '@/types/supabase'

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
        r.relationship_type === 'parent-child' &&
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
   */
  validateSpouse(person1Id: string, person2Id: string): ValidationResult {
    // Check if same person
    if (person1Id === person2Id) {
      return {
        valid: false,
        error: 'A person cannot be their own spouse',
      }
    }

    // Check if relationship already exists (bidirectional)
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

    // Optional: Check if persons are directly related (parent-child)
    const isDirectlyRelated = this.relationships.some(
      (r) =>
        r.relationship_type === 'parent-child' &&
        ((r.parent_id === person1Id && r.child_id === person2Id) ||
          (r.parent_id === person2Id && r.child_id === person1Id))
    )

    if (isDirectlyRelated) {
      return {
        valid: false,
        error: 'Cannot marry a parent or child',
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
          (r) => r.child_id === current && r.relationship_type === 'parent-child'
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
          (r) => r.parent_id === current && r.relationship_type === 'parent-child'
        )
        .map((r) => r.child_id)

      children.forEach((childId) => {
        descendants.add(childId)
        queue.push(childId)
      })
    }

    return Array.from(descendants)
  }

  /**
   * Get generation level (depth from root ancestors)
   */
  getGenerationLevel(personId: string): number {
    const ancestors = this.getAncestors(personId)
    
    if (ancestors.length === 0) {
      return 0 // Root generation
    }

    // BFS to find maximum depth
    let maxDepth = 0
    const queue: Array<{ id: string; depth: number }> = [
      { id: personId, depth: 0 },
    ]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!

      if (visited.has(id)) continue
      visited.add(id)

      const parents = this.relationships
        .filter((r) => r.child_id === id && r.relationship_type === 'parent-child')
        .map((r) => r.parent_id)

      if (parents.length === 0) {
        maxDepth = Math.max(maxDepth, depth)
      } else {
        parents.forEach((parentId) => {
          queue.push({ id: parentId, depth: depth + 1 })
        })
      }
    }

    return maxDepth
  }

  /**
   * Check if two persons are related
   */
  areRelated(person1Id: string, person2Id: string): boolean {
    const person1Ancestors = this.getAncestors(person1Id)
    const person1Descendants = this.getDescendants(person1Id)
    const person2Ancestors = this.getAncestors(person2Id)
    const person2Descendants = this.getDescendants(person2Id)

    // Check if one is ancestor/descendant of the other
    if (
      person1Ancestors.includes(person2Id) ||
      person1Descendants.includes(person2Id)
    ) {
      return true
    }

    // Check if they share common ancestors
    const commonAncestors = person1Ancestors.filter((id) =>
      person2Ancestors.includes(id)
    )

    return commonAncestors.length > 0
  }
}

/**
 * Convenience function for quick validation
 */
export function validateRelationship(
  type: 'parent-child' | 'spouse',
  person1Id: string,
  person2Id: string,
  relationships: Relationship[]
): ValidationResult {
  const validator = new RelationshipValidator(relationships)

  if (type === 'parent-child') {
    return validator.validateParentChild(person1Id, person2Id)
  } else {
    return validator.validateSpouse(person1Id, person2Id)
  }
}
