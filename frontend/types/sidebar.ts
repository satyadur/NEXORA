import { ComponentType, SVGProps } from "react"

export interface SidebarUser {
  name: string
  email: string
  avatar: string
}

export interface SidebarSubItem {
  title: string
  url: string
}

export interface SidebarNavItem {
  title: string
  url: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  items?: SidebarSubItem[]
  isActive?: boolean
}

export interface SidebarDocumentItem {
  name: string
  url: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export interface SidebarData {
  user: SidebarUser
  navMain: SidebarNavItem[]
}
