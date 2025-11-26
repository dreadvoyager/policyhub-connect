import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { policyApi, claimApi } from '@/services/api';
import { Policy, Claim, DashboardStats } from '@/types';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import { 
  FileText, 
  ClipboardList, 
  TrendingUp, 
  DollarSign,
  ArrowRight,
  Shield,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policiesData, claimsData] = await Promise.all([
          policyApi.getAll(),
          claimApi.getAll(),
        ]);
        setPolicies(policiesData);
        setClaims(claimsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats: DashboardStats = {
    totalPolicies: policies.length,
    activePolicies: policies.filter((p) => p.status === 'Active').length,
    totalClaims: claims.length,
    pendingClaims: claims.filter((c) => c.status === 'Submitted' || c.status === 'Under Review').length,
    totalPremium: policies.reduce((sum, p) => sum + p.premiumAmt, 0),
    totalClaimAmount: claims.filter((c) => c.status === 'Approved').reduce((sum, c) => sum + c.claimAmt, 0),
  };

  const recentPolicies = policies.slice(0, 3);
  const recentClaims = claims.slice(0, 3);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 page-transition">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your insurance portfolio
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow-card p-6 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Policies</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalPolicies}</p>
                <p className="text-sm text-success mt-1">
                  {stats.activePolicies} active
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-6 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Claims</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalClaims}</p>
                <p className="text-sm text-warning mt-1">
                  {stats.pendingClaims} pending
                </p>
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <ClipboardList className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-6 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Premium</p>
                <p className="text-3xl font-bold text-foreground">
                  ${stats.totalPremium.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Annual</p>
              </div>
              <div className="p-3 rounded-xl bg-info/10">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-6 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Claims Approved</p>
                <p className="text-3xl font-bold text-foreground">
                  ${stats.totalClaimAmount.toLocaleString()}
                </p>
                <p className="text-sm text-success mt-1">Total paid</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Policies */}
          <div className="bg-card rounded-lg shadow-card">
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-heading text-lg font-semibold text-foreground">Recent Policies</h3>
              <Link to="/policies">
                <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="px-6 pb-6">
              {recentPolicies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No policies yet</p>
                  <Link to="/policies">
                    <button className="mt-4 px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors">
                      Add your first policy
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPolicies.map((policy) => (
                    <div
                      key={policy.policyId}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{policy.insurer}</p>
                          <p className="text-sm text-muted-foreground">{policy.policyType}</p>
                        </div>
                      </div>
                      <StatusBadge status={policy.status} type="policy" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Claims */}
          <div className="bg-card rounded-lg shadow-card">
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="font-heading text-lg font-semibold text-foreground">Recent Claims</h3>
              <Link to="/claims">
                <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="px-6 pb-6">
              {recentClaims.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No claims submitted</p>
                  <Link to="/claims">
                    <button className="mt-4 px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors">
                      File a claim
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentClaims.map((claim) => (
                    <div
                      key={claim.claimId}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <ClipboardList className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            ${claim.claimAmt.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {claim.description}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={claim.status} type="claim" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-card rounded-lg shadow-card gradient-card p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl gradient-primary">
                <AlertCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">
                  Need assistance?
                </h3>
                <p className="text-sm text-muted-foreground">
                  File a claim or add a new policy with just a few clicks
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/policies">
                <button className="px-4 py-2 border border-input rounded-md hover:bg-secondary transition-colors font-medium">
                  Add Policy
                </button>
              </Link>
              <Link to="/claims">
                <button className="px-4 py-2 gradient-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium">
                  File Claim
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
