import { useState, useEffect } from 'react';
import { policyApi } from '@/services/api';
import { Policy, CreatePolicyRequest, UpdatePolicyRequest } from '@/types';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building2, 
  Edit2, 
  X,
  Loader2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const policyTypes = ['Life', 'Health', 'Motor', 'Home', 'Travel', 'Business'];
const policyStatuses = ['Active', 'Lapsed', 'Cancelled'];

const Policies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  const [formData, setFormData] = useState<CreatePolicyRequest & { status?: string }>({
    insurer: '',
    policyType: '',
    premiumAmt: 0,
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    let result = policies;
    
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.insurer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.policyType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      result = result.filter((p) => p.policyType === filterType);
    }
    
    setFilteredPolicies(result);
  }, [policies, searchTerm, filterType]);

  const fetchPolicies = async () => {
    try {
      const data = await policyApi.getAll();
      setPolicies(data);
      setFilteredPolicies(data);
    } catch (error) {
      toast.error('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'premiumAmt' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.insurer.trim()) newErrors.insurer = 'Insurer is required';
    if (!formData.policyType) newErrors.policyType = 'Policy type is required';
    if (!formData.premiumAmt || formData.premiumAmt <= 0) {
      newErrors.premiumAmt = 'Valid premium amount is required';
    }
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingPolicy) {
        const updateData: UpdatePolicyRequest = {
          ...formData,
          status: formData.status || 'Active',
        };
        await policyApi.update(editingPolicy.policyId, updateData);
        toast.success('Policy updated successfully');
      } else {
        await policyApi.create(formData);
        toast.success('Policy created successfully');
      }
      fetchPolicies();
      closeModal();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFormData({
      insurer: '',
      policyType: '',
      premiumAmt: 0,
      startDate: '',
      endDate: '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      insurer: policy.insurer,
      policyType: policy.policyType,
      premiumAmt: policy.premiumAmt,
      startDate: policy.startDate.split('T')[0],
      endDate: policy.endDate.split('T')[0],
      status: policy.status,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
    setFormData({
      insurer: '',
      policyType: '',
      premiumAmt: 0,
      startDate: '',
      endDate: '',
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

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading policies..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 page-transition">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              My Policies
            </h1>
            <p className="text-muted-foreground">
              Manage and track all your insurance policies
            </p>
          </div>
          <Button onClick={openCreateModal} className="gradient-primary">
            <Plus className="w-5 h-5 mr-2" />
            Add Policy
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by insurer or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {policyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Policies Grid */}
        {filteredPolicies.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                No policies found
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first policy'}
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button onClick={openCreateModal} className="gradient-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Policy
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy) => (
              <Card key={policy.policyId} className="border-0 shadow-card card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="font-heading text-lg">{policy.insurer}</CardTitle>
                        <p className="text-sm text-muted-foreground">{policy.policyType}</p>
                      </div>
                    </div>
                    <StatusBadge status={policy.status} type="policy" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground font-medium">
                        ${policy.premiumAmt.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Policy #{policy.policyId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatDate(policy.startDate)} - {formatDate(policy.endDate)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(policy)}
                      className="w-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Policy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="insurer">Insurer Name</Label>
                <Input
                  id="insurer"
                  name="insurer"
                  value={formData.insurer}
                  onChange={handleChange}
                  placeholder="e.g., State Farm"
                  className={errors.insurer ? 'border-destructive' : ''}
                />
                {errors.insurer && (
                  <p className="text-xs text-destructive">{errors.insurer}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyType">Policy Type</Label>
                <Select
                  value={formData.policyType}
                  onValueChange={(value) => handleSelectChange('policyType', value)}
                >
                  <SelectTrigger className={errors.policyType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.policyType && (
                  <p className="text-xs text-destructive">{errors.policyType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="premiumAmt">Premium Amount ($)</Label>
                <Input
                  id="premiumAmt"
                  name="premiumAmt"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.premiumAmt || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={errors.premiumAmt ? 'border-destructive' : ''}
                />
                {errors.premiumAmt && (
                  <p className="text-xs text-destructive">{errors.premiumAmt}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={errors.startDate ? 'border-destructive' : ''}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-destructive">{errors.startDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={errors.endDate ? 'border-destructive' : ''}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </div>

              {editingPolicy && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {policyStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                      {editingPolicy ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingPolicy ? (
                    'Update Policy'
                  ) : (
                    'Create Policy'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Policies;
