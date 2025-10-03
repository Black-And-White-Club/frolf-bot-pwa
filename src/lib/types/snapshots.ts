// Minimal presentation types for leaderboard snapshots and patch envelopes
export interface TopTag {
  tag: string
  count: number
}

export interface Player {
  userId: string
  name: string
  score: number
}

export interface LeaderboardSnapshot {
  id: string
  version: number
  lastUpdated: string
  topTags: TopTag[]
  topPlayers: Player[]
  metadata?: Record<string, any>
}

export interface SnapshotEnvelope {
  type: 'snapshot'
  schema: string
  version: number
  ts: string
  payload: LeaderboardSnapshot
}

export interface PatchEnvelope {
  type: 'patch'
  schema: string
  version: number
  op: string
  payload: Record<string, unknown>
  ts: string
}

export type Envelope = SnapshotEnvelope | PatchEnvelope
