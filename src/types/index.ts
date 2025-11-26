// User types
export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Policy types
export interface Policy {
  policyId: number;
  userId: number;
  insurer: string;
  policyType: string;
  premiumAmt: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Lapsed' | 'Cancelled';
}

export interface CreatePolicyRequest {
  insurer: string;
  policyType: string;
  premiumAmt: number;
  startDate: string;
  endDate: string;
}

export interface UpdatePolicyRequest extends CreatePolicyRequest {
  status: string;
}

// Claim types
export interface Claim {
  claimId: number;
  policyId: number;
  userId: number;
  claimAmt: number;
  description: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  submittedAt: string;
  policy?: Policy;
}

export interface CreateClaimRequest {
  policyId: number;
  claimAmt: number;
  description: string;
}

export interface UpdateClaimRequest {
  claimAmt: number;
  description: string;
}

// Dashboard stats
export interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  pendingClaims: number;
  totalPremium: number;
  totalClaimAmount: number;
}
