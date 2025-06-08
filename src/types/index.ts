export interface User {
  id: string
  email: string
  username?: string
  hotcoinBalance?: number
  isAdmin?: boolean
}

export interface Box {
  id: string
  row: number
  column: number
  userId: string | null
  gameId: string
}

export interface Game {
  id: string
  name: string
  homeTeam: string
  awayTeam: string
  homeScores: number[]
  awayScores: number[]
  isActive: boolean
  createdAt: string
  entryFee: number
  sport: 'NFL' | 'NBA'
  gameDate: string
  numbersAssigned: boolean
  homeNumbers?: number[]
  awayNumbers?: number[]
}

export interface HotCoinTransaction {
  id: string
  userId: string
  type: 'purchase' | 'bet' | 'payout' | 'refund' | 'withdrawal'
  amount: number
  description: string
  gameId?: string
  createdAt: string
  paymentMethod?: 'cashapp' | 'venmo' | 'paypal'
  transactionId?: string
  verificationStatus?: 'pending' | 'approved' | 'rejected'
  autoApproved?: boolean
}

export interface Purchase {
  id: string
  userId: string
  amount: number
  stripePaymentIntentId: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}