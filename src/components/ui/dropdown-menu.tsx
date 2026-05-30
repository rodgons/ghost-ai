"use client";

import { Menu } from "@base-ui/react/menu";
import * as React from "react";
import { cn } from "@/lib/utils";

const MenuCheckboxItem = Menu.CheckboxItem;
const MenuItem = Menu.Item;
const MenuPositioner = Menu.Positioner;
const MenuPopup = Menu.Popup;
const MenuPortal = Menu.Portal;
const MenuRadioItem = Menu.RadioItem;
const MenuRoot = Menu.Root;
const MenuSeparator = Menu.Separator;
const MenuTrigger = Menu.Trigger;

type MenuRootProps = React.ComponentProps<typeof MenuRoot>;
type DropdownMenuTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof MenuTrigger>,
  "render"
> & {
  asChild?: boolean;
};

const DropdownMenu = MenuRoot;

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ asChild, children, ...props }, ref) => (
  <MenuTrigger
    ref={ref}
    render={asChild && React.isValidElement(children) ? children : undefined}
    {...props}
  >
    {asChild ? undefined : children}
  </MenuTrigger>
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuPositioner>
>(({ className, children, ...props }, ref) => (
  <MenuPortal>
    <MenuPositioner ref={ref} className="z-50" {...props}>
      <MenuPopup
        className={cn(
          "min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className,
        )}
      >
        {children}
      </MenuPopup>
    </MenuPositioner>
  </MenuPortal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof MenuItem>
>(({ className, ...props }, ref) => (
  <MenuItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof MenuCheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenuCheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    {children}
  </MenuCheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<typeof MenuRadioItem>
>(({ className, children, ...props }, ref) => (
  <MenuRadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </MenuRadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof MenuSeparator>
>(({ className, ...props }, ref) => (
  <MenuSeparator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Menu,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  MenuItem,
  MenuSeparator,
  MenuCheckboxItem,
  MenuRadioItem,
};
export type { MenuRootProps };
