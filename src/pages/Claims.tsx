import { useState, useEffect } from 'react';
import { claimApi, policyApi } from '@/services/api';
import { Claim, Policy, CreateClaimRequest, UpdateClaimRequest } from '@/types';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import {
  Plus,
  ClipboardList,
  Calendar,
  DollarSign,
  FileText,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

const Claims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [deletingClaim, setDeletingClaim] = useState<Claim | null>(null);

  const [formData, setFormData] = useState<CreateClaimRequest>({
    policyId: 0,
    claimAmt: 0,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const claimStatuses = ['Submitted', 'Under Review', 'Approved', 'Rejected'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = claims;

    if (searchTerm) {
      result = result.filter((c) =>
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter((c) => c.status === filterStatus);
    }

    setFilteredClaims(result);
  }, [claims, searchTerm, filterStatus]);

  const fetchData = async () => {
    try {
      const [claimsData, policiesData] = await Promise.all([
        claimApi.getAll(),
        policyApi.getAll(),
      ]);
      setClaims(claimsData);
      setPolicies(policiesData);
      setFilteredClaims(claimsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'claimAmt' ? parseFloat(value) || 0 : name === 'policyId' ? parseInt(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.policyId) newErrors.policyId = 'Please select a policy';
    if (!formData.claimAmt || formData.claimAmt <= 0) {
      newErrors.claimAmt = 'Valid claim amount is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingClaim) {
        const updateData: UpdateClaimRequest = {
          claimAmt: formData.claimAmt,
          description: formData.description,
        };
        await claimApi.update(editingClaim.claimId, updateData);
        toast.success('Claim updated successfully');
      } else {
        await claimApi.create(formData);
        toast.success('Claim submitted successfully');
      }
      fetchData();
      closeModal();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClaim) return;

    setIsSubmitting(true);
    try {
      await claimApi.delete(deletingClaim.claimId);
      toast.success('Claim deleted successfully');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete claim';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setDeletingClaim(null);
    }
  };

  const openCreateModal = () => {
    setEditingClaim(null);
    setFormData({
      policyId: 0,
      claimAmt: 0,
      description: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (claim: Claim) => {
    setEditingClaim(claim);
    setFormData({
      policyId: claim.policyId,
      claimAmt: claim.claimAmt,
      description: claim.description,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openDeleteDialog = (claim: Claim) => {
    setDeletingClaim(claim);
    setIsDeleteDialogOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClaim(null);
    setFormData({
      policyId: 0,
      claimAmt: 0,
      description: '',
    });
    setErrors({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canModifyClaim = (claim: Claim) => {
    return claim.status === 'Submitted';
  };

  const getPolicyInfo = (policyId: number) => {
    return policies.find((p) => p.policyId === policyId);
  };

  const activePolicies = policies.filter((p) => p.status === 'Active');

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading claims..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 page-transition">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              My Claims
            </h1>
            <p className="text-muted-foreground">
              Submit and track your insurance claims
            </p>
          </div>
          <button
            onClick={openCreateModal}
            disabled={activePolicies.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 gradient-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            File Claim
          </button>
        </div>

        {activePolicies.length === 0 && (
          <div className="bg-warning/5 border border-warning/20 border-l-4 border-l-warning rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <p className="text-sm text-foreground">
              You need at least one active policy to file a claim.{' '}
              <a href="/policies" className="text-primary font-medium hover:underline">
                Add a policy
              </a>
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-48 h-10 px-3 pr-8 rounded-md border border-input bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {claimStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Claims List */}
        {filteredClaims.length === 0 ? (
          <div className="bg-card rounded-lg shadow-card p-12 text-center">
            <ClipboardList className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
              No claims found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'File your first claim to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && activePolicies.length > 0 && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 gradient-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                File Your First Claim
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map((claim) => {
              const policy = getPolicyInfo(claim.policyId);
              return (
                <div key={claim.claimId} className="bg-card rounded-lg shadow-card p-6 card-hover">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-accent/10">
                        <ClipboardList className="w-6 h-6 text-accent" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-heading font-semibold text-lg text-foreground">
                            Claim #{claim.claimId}
                          </h3>
                          <StatusBadge status={claim.status} type="claim" />
                        </div>
                        <p className="text-muted-foreground">{claim.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium text-foreground">
                              ${claim.claimAmt.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(claim.submittedAt)}</span>
                          </div>
                          {policy && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span>
                                {policy.insurer} - {policy.policyType}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {canModifyClaim(claim) && (
                      <div className="flex items-center gap-2 md:ml-4">
                        <button
                          onClick={() => openEditModal(claim)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-secondary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteDialog(claim)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-input rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-card rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    {editingClaim ? 'Edit Claim' : 'File New Claim'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {editingClaim
                    ? 'Update your claim details below'
                    : 'Submit a new claim for one of your policies'}
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!editingClaim && (
                    <div className="space-y-2">
                      <label htmlFor="policyId" className="block text-sm font-medium text-foreground">
                        Select Policy
                      </label>
                      <div className="relative">
                        <select
                          id="policyId"
                          name="policyId"
                          value={formData.policyId}
                          onChange={handleChange}
                          className={`w-full h-10 px-3 pr-8 rounded-md border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer ${
                            errors.policyId ? 'border-destructive' : 'border-input'
                          }`}
                        >
                          <option value={0}>Select a policy</option>
                          {activePolicies.map((policy) => (
                            <option key={policy.policyId} value={policy.policyId}>
                              {policy.insurer} - {policy.policyType}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                      {errors.policyId && (
                        <p className="text-xs text-destructive">{errors.policyId}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="claimAmt" className="block text-sm font-medium text-foreground">
                      Claim Amount ($)
                    </label>
                    <input
                      id="claimAmt"
                      name="claimAmt"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.claimAmt || ''}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full h-10 px-3 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.claimAmt ? 'border-destructive' : 'border-input'
                      }`}
                    />
                    {errors.claimAmt && (
                      <p className="text-xs text-destructive">{errors.claimAmt}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-foreground">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your claim..."
                      rows={4}
                      className={`w-full px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                        errors.description ? 'border-destructive' : 'border-input'
                      }`}
                    />
                    <div className="flex justify-between text-xs">
                      {errors.description ? (
                        <p className="text-destructive">{errors.description}</p>
                      ) : (
                        <span />
                      )}
                      <span className="text-muted-foreground">
                        {formData.description.length}/200
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 h-10 px-4 border border-input rounded-md hover:bg-secondary transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-10 px-4 gradient-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {editingClaim ? 'Updating...' : 'Submitting...'}
                        </>
                      ) : editingClaim ? (
                        'Update Claim'
                      ) : (
                        'Submit Claim'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsDeleteDialogOpen(false)} />
            <div className="relative bg-card rounded-lg shadow-lg w-full max-w-md mx-4 animate-fade-in">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-destructive/10">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      Delete Claim
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to delete this claim?
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  This action cannot be undone. The claim will be permanently removed from your account.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="flex-1 h-10 px-4 border border-input rounded-md hover:bg-secondary transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 h-10 px-4 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Claim'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Claims;
