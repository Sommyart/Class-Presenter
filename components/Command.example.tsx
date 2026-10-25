import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./Command";
import { Button } from "./Button";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";

export const DialogCommandExample = {
  size: "md",
  backdrop: "surface",
  title: "Dialog Command Menu",
  component: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Command Menu</Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <Calendar />
                <span>Calendar</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Smile />
                <span>Search Emoji</span>
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Calculator />
                <span>Calculator</span>
                <CommandShortcut>⌘K</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                <User />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCard />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Settings />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};

export const ComboBoxCommandExample = {
  size: "md",
  backdrop: "surface",
  title: "Combobox Command Menu",
  component: () => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState("");
    const frameworks = ["React", "Vue", "Angular", "Svelte"];

    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {selected ? selected : "Select a framework"}
            </Button>
          </PopoverTrigger>
          <PopoverContent removeBackgroundAndPadding>
            <Command>
              <CommandInput placeholder="Search framework..." autoFocus />
              <CommandList>
                <CommandEmpty>No frameworks found.</CommandEmpty>
                <CommandGroup>
                  {frameworks.map((framework) => (
                    <CommandItem
                      key={framework}
                      onSelect={() => {
                        setSelected(framework);
                        setOpen(false);
                      }}
                    >
                      {framework}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </>
    );
  },
};
