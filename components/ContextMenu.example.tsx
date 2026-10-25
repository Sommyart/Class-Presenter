import React from 'react';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuLabel,
} from "./ContextMenu"

export const BasicContextMenuExample = {
  size: "md",
  backdrop: "surface",
  title: "Basic Context Menu",
  component: () => (
    <div style={{ 
      padding: "var(--spacing-xl)",
      backgroundColor: "var(--color-surface)",
      borderRadius: "var(--radius-md)"
    }}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div style={{ 
            padding: "var(--spacing-xl)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)"
          }}>
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>File Operations</ContextMenuLabel>
          <ContextMenuItem>
            New File
            <ContextMenuShortcut>⌘N</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Open
            <ContextMenuShortcut>⌘O</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>View Options</ContextMenuLabel>
          <ContextMenuCheckboxItem checked>
            Show Hidden Files
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem>
            Show Path Bar
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Copy Link</ContextMenuItem>
              <ContextMenuItem>Email</ContextMenuItem>
              <ContextMenuItem>Message</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
};

