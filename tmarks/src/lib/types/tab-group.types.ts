export interface TabGroupItem {
  id: string
  group_id: string
  title: string
  url: string
  favicon: string | null
  position: number
  created_at: string
  is_pinned?: boolean
  is_todo?: boolean
  is_archived?: boolean
}

export interface TabGroup {
  id: string
  user_id: string
  title: string
  color: string | null
  tags: string[] | null
  parent_id: string | null
  is_folder: number
  is_deleted: number
  deleted_at: string | null
  position: number
  created_at: string
  updated_at: string
  items?: TabGroupItem[]
  item_count?: number
  children?: TabGroup[]
}

export interface CreateTabGroupRequest {
  title?: string
  parent_id?: string | null
  is_folder?: number // Changed from boolean to number to match TabGroup.is_folder
  items?: Array<{
    title: string
    url: string
    favicon?: string
  }>
}

export interface UpdateTabGroupRequest {
  title?: string
  color?: string | null
  tags?: string[] | null
  parent_id?: string | null
  position?: number
}

export interface TabGroupsResponse {
  tab_groups: TabGroup[]
  meta?: {
    page_size?: number
    count: number
    next_cursor?: string
    has_more?: boolean
  }
}

export interface TabGroupResponse {
  tab_group: TabGroup
}

export interface Share {
  id: string
  group_id: string
  user_id: string
  share_token: string
  is_public: number
  view_count: number
  created_at: string
  expires_at: string | null
}

export interface ShareResponse {
  share: Share
  share_url: string
}

export interface StatisticsSummary {
  total_groups: number
  total_deleted_groups: number
  total_items: number
  total_shares: number
}

export interface TrendData {
  date: string
  count: number
}

export interface DomainCount {
  domain: string
  count: number
}

export interface GroupSizeDistribution {
  range: string
  count: number
}

export interface StatisticsResponse {
  summary: StatisticsSummary
  trends: {
    groups: TrendData[]
    items: TrendData[]
  }
  top_domains: DomainCount[]
  group_size_distribution: GroupSizeDistribution[]
}
