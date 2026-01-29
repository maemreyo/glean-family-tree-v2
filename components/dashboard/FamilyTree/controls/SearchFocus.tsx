import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PersonWithPhoto } from '@/types/app'

interface SearchFocusProps {
  persons: PersonWithPhoto[]
  onFocus: (personId: string) => void
}

export function SearchFocus({ persons, onFocus }: SearchFocusProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? persons.find((person) => person.id === value)?.name
            : "Search person..."}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search person..." />
          <CommandList>
            <CommandEmpty>No person found.</CommandEmpty>
            <CommandGroup>
              {persons.map((person) => (
                <CommandItem
                  key={person.id}
                  value={person.name}
                  onSelect={() => {
                    setValue(person.id === value ? '' : person.id)
                    onFocus(person.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === person.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {person.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
