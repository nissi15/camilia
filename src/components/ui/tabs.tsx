"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex items-center justify-center text-muted-foreground group-data-horizontal/tabs:h-fit group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "rounded-xl bg-muted/70 p-1 gap-0.5 border border-border/30 shadow-xs",
        line:
          "gap-0 bg-transparent border-b border-border/60 w-full rounded-none pb-0",
        pills:
          "gap-1.5 bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium select-none outline-none",
        "transition-all duration-200 ease-out",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:rounded-md",
        "disabled:pointer-events-none disabled:opacity-40",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        // ── default variant ──
        "group-data-[variant=default]/tabs-list:rounded-[8px]",
        "group-data-[variant=default]/tabs-list:px-3.5 group-data-[variant=default]/tabs-list:py-1.5",
        "group-data-[variant=default]/tabs-list:text-muted-foreground",
        "group-data-[variant=default]/tabs-list:hover:text-foreground group-data-[variant=default]/tabs-list:hover:bg-background/60",
        // active state
        "group-data-[variant=default]/tabs-list:data-active:bg-background",
        "group-data-[variant=default]/tabs-list:data-active:text-foreground",
        "group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        "group-data-[variant=default]/tabs-list:data-active:ring-1 group-data-[variant=default]/tabs-list:data-active:ring-border/40",

        // ── line variant ──
        "group-data-[variant=line]/tabs-list:rounded-none",
        "group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:py-2.5 group-data-[variant=line]/tabs-list:mb-[-1px]",
        "group-data-[variant=line]/tabs-list:text-muted-foreground",
        "group-data-[variant=line]/tabs-list:hover:text-foreground",
        // animated underline indicator
        "after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-t-full after:bg-primary",
        "after:scale-x-0 after:transition-transform after:duration-200 after:origin-center",
        "group-data-[variant=line]/tabs-list:data-active:after:scale-x-100",
        "group-data-[variant=line]/tabs-list:data-active:text-foreground",
        "group-data-[variant=line]/tabs-list:data-active:font-semibold",

        // ── pills variant ──
        "group-data-[variant=pills]/tabs-list:rounded-full",
        "group-data-[variant=pills]/tabs-list:px-4 group-data-[variant=pills]/tabs-list:py-1.5",
        "group-data-[variant=pills]/tabs-list:text-muted-foreground group-data-[variant=pills]/tabs-list:border group-data-[variant=pills]/tabs-list:border-transparent",
        "group-data-[variant=pills]/tabs-list:hover:bg-muted group-data-[variant=pills]/tabs-list:hover:text-foreground",
        // active
        "group-data-[variant=pills]/tabs-list:data-active:bg-primary group-data-[variant=pills]/tabs-list:data-active:text-primary-foreground",
        "group-data-[variant=pills]/tabs-list:data-active:shadow-sm",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
