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
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'claimAmt' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'policyId' ? parseInt(value) : value,
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
          <Button
            onClick={openCreateModal}
            disabled={activePolicies.length === 0}
            className="gradient-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            File Claim
          </Button>
        </div>

        {activePolicies.length === 0 && (
          <Card className="border-0 shadow-card mb-6 bg-warning/5 border-l-4 border-l-warning">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <p className="text-sm text-foreground">
                You need at least one active policy to file a claim.{' '}
                <a href="/policies" className="text-primary font-medium hover:underline">
                  Add a policy
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {claimStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Claims List */}
        {filteredClaims.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="p-12 text-center">
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
                <Button onClick={openCreateModal} className="gradient-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  File Your First Claim
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map((claim) => {
              const policy = getPolicyInfo(claim.policyId);
              return (
                <Card key={claim.claimId} className="border-0 shadow-card card-hover">
                  <CardContent className="p-6">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(claim)}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(claim)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingClaim ? 'Edit Claim' : 'File New Claim'}
              </DialogTitle>
              <DialogDescription>
                {editingClaim
                  ? 'Update your claim details below'
                  : 'Submit a new claim for one of your policies'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingClaim && (
                <div className="space-y-2">
                  <Label htmlFor="policyId">Select Policy</Label>
                  <Select
                    value={formData.policyId.toString()}
                    onValueChange={(value) => handleSelectChange('policyId', value)}
                  >
                    <SelectTrigger className={errors.policyId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select a policy" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePolicies.map((policy) => (
                        <SelectItem key={policy.policyId} value={policy.policyId.toString()}>
                          {policy.insurer} - {policy.policyType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.policyId && (
                    <p className="text-xs text-destructive">{errors.policyId}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="claimAmt">Claim Amount ($)</Label>
                <Input
                  id="claimAmt"
                  name="claimAmt"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.claimAmt || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.claimAmt ? 'border-destructive' : ''}
                />
                {errors.claimAmt && (
                  <p className="text-xs text-destructive">{errors.claimAmt}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your claim..."
                  rows={4}
                  className={errors.description ? 'border-destructive' : ''}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 gradient-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingClaim ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : editingClaim ? (
                    'Update Claim'
                  ) : (
                    'Submit Claim'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Claim</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this claim? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Claims;
