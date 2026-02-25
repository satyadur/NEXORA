"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    badge?: string | number;
    badgeVariant?: "default" | "destructive" | "outline" | "secondary" | "success" | "warning";
    items?: {
      title: string;
      url: string;
      badge?: string | number;
      badgeVariant?: "default" | "destructive" | "outline" | "secondary" | "success" | "warning";
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-4 py-2">
        Platform
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1 px-2">
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;

          /* =====================================================
             🔥 ORIGINAL PERFECT ACTIVE LOGIC (RESTORED)
          ===================================================== */

          const pathnameSegments = pathname
            .split("/")
            .filter(Boolean);

          const itemSegments = item.url
            .split("/")
            .filter(Boolean);

          const isExactMatch = pathname === item.url;
          const isNestedMatch =
            pathname.startsWith(item.url + "/");

          // Root dashboard detection ( /student /teacher /admin )
          const isRootDashboard =
            itemSegments.length === 1;

          const isParentActive = isRootDashboard
            ? isExactMatch
            : isExactMatch || isNestedMatch;

          const isAnySubItemActive = item.items?.some((subItem) => {
            return pathname === subItem.url;
          }) || false;

          const shouldBeOpen = isParentActive || isAnySubItemActive;

          /* =====================================================
             🔹 WITH SUB ITEMS (Collapsible)
          ===================================================== */

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                defaultOpen={shouldBeOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={`
                        relative h-12 px-4 py-3 text-base font-medium
                        transition-all duration-200
                        hover:bg-primary/10 hover:text-primary
                        data-[state=open]:bg-primary/5
                        ${isParentActive ? "bg-primary/15 text-primary font-semibold border-l-4 border-primary" : ""}
                      `}
                    >
                      {item.icon && (
                        <item.icon className={`h-5 w-5 shrink-0 ${isParentActive ? "text-primary" : "text-muted-foreground"}`} />
                      )}
                      <span className="flex-1 truncate">{item.title}</span>
                      
                      {item.badge && (
                        <Badge 
                          variant={"secondary"} 
                          className="ml-auto mr-1 h-5 px-1.5 text-xs font-mono"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-1 ml-2 pl-4 border-l-2 border-primary/20">
                    <SidebarMenuSub className="space-y-1">
                      {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url;

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={`
                                relative h-10 px-3 py-2 text-sm
                                transition-all duration-200
                                hover:bg-primary/10 hover:text-primary
                                ${isSubActive 
                                  ? "bg-primary/15 text-primary font-medium border-l-2 border-primary" 
                                  : "text-muted-foreground"
                                }
                              `}
                            >
                              <Link href={subItem.url} className="flex items-center gap-2 w-full">
                                <span className="flex-1 truncate">{subItem.title}</span>
                                
                                {subItem.badge && (
                                  <Badge 
                                    variant={"secondary"} 
                                    className="h-5 px-1.5 text-xs font-mono"
                                  >
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          /* =====================================================
             🔹 WITHOUT SUB ITEMS (Simple Link)
          ===================================================== */

          return (
            <SidebarMenuItem key={item.title}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={`
                        relative h-12 px-4 py-3 text-base font-medium
                        transition-all duration-200
                        hover:bg-primary/10 hover:text-primary
                        ${isParentActive 
                          ? "bg-primary/15 text-primary font-semibold border-l-4 border-primary" 
                          : "text-muted-foreground"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        {item.icon && (
                          <item.icon className={`h-5 w-5 shrink-0 ${isParentActive ? "text-primary" : "text-muted-foreground"}`} />
                        )}
                        <span className="flex-1 truncate">{item.title}</span>
                        
                        {item.badge && (
                          <Badge 
                            variant={"secondary"} 
                            className="h-5 px-1.5 text-xs font-mono"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-sm">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}