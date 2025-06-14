
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const destinations = [
  { value: "pokhara, nepal", label: "Pokhara, Nepal" },
  { value: "kathmandu, nepal", label: "Kathmandu, Nepal" },
  { value: "chitwan national park, nepal", label: "Chitwan National Park, Nepal" },
  { value: "lumbini, nepal", label: "Lumbini, Nepal" },
  { value: "everest base camp, nepal", label: "Everest Base Camp, Nepal" },
  { value: "annapurna circuit, nepal", label: "Annapurna Circuit, Nepal" },
  { value: "paris, france", label: "Paris, France" },
  { value: "rome, italy", label: "Rome, Italy" },
  { value: "bali, indonesia", label: "Bali, Indonesia" },
  { value: "tokyo, japan", label: "Tokyo, Japan" },
  { value: "new york city, usa", label: "New York City, USA" },
  { value: "london, uk", label: "London, UK" },
  { value: "barcelona, spain", label: "Barcelona, Spain" },
  { value: "amsterdam, netherlands", label: "Amsterdam, Netherlands" },
  { value: "phuket, thailand", label: "Phuket, Thailand" },
];

interface DestinationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DestinationCombobox({ value, onChange, placeholder = "Select destination..." }: DestinationComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value
            ? destinations.find((destination) => destination.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search destination..." />
          <CommandList>
            <CommandEmpty>No destination found.</CommandEmpty>
            <CommandGroup>
              {destinations.map((destination) => (
                <CommandItem
                  key={destination.value}
                  value={destination.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === destination.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {destination.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
