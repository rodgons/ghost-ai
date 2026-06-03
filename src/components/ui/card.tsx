import { cn } from "@/lib/utils";

/**
 * Renders a styled card container div with `data-slot="card"` and an adjustable size variant.
 *
 * @param size - Controls spacing and padding; `"default"` applies standard spacing, `"sm"` reduces gaps and padding.
 * @param className - Additional CSS classes merged with the component's default styling.
 * @returns A div element serving as the card container with `data-slot="card"` and `data-size` set to `size`.
 */
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the card header container for title, description, and action slots.
 *
 * Renders a div with `data-slot="card-header"` and layout/padding classes; respects `data-size` and present slot elements to adjust grid structure and spacing. Merges any provided `className` and forwards remaining div props.
 *
 * @param className - Additional CSS class names appended to the header's classes
 * @param props - Other div element props forwarded to the rendered element
 * @returns A div element with `data-slot="card-header"` that serves as the card's header container
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a card title container with typographic styles and the `data-slot="card-title"` attribute.
 *
 * @returns A `div` element with `data-slot="card-title"`, preset heading typography classes, and any provided `className` and other `div` props merged into the element.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders a card description element with muted, small text styling.
 *
 * @returns A `div` element with `data-slot="card-description"`, merged `className` (`text-sm text-muted-foreground` plus any provided classes), and all other props forwarded to the underlying element.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Renders the card action container positioned in the header grid for right-aligned header actions.
 *
 * @returns The `div` element used as the card action slot.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Renders the card's content container with horizontal padding and a `data-slot="card-content"` attribute.
 *
 * The component applies reduced horizontal padding when the parent card's `data-size` is `"sm"`. Any
 * `className` and other div props are forwarded to the rendered element.
 *
 * @returns The card content container element
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  );
}

/**
 * Renders the card footer container with footer-specific styling and a `data-slot="card-footer"` attribute.
 *
 * The element provides a muted background, top border, rounded bottom corners, and reduced padding when the parent card uses `data-size="sm"`.
 *
 * @param className - Optional additional class names merged into the footer element
 * @returns The footer `<div>` element
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
