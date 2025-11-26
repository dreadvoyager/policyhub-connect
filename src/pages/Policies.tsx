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
  Search,
  ChevronDown
} from 'lucide-react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'premiumAmt' ? parseFloat(value) || 0 : value,
    }));
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
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 gradient-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Add Policy
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                placeholder="Search by insurer or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full md:w-48 h-10 px-3 pr-8 rounded-md border border-input bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
              >
                <option value="all">All Types</option>
                {policyTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Policies Grid */}
        {filteredPolicies.length === 0 ? (
          <div className="bg-card rounded-lg shadow-card p-12 text-center">
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
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 gradient-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                Add Your First Policy
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy) => (
              <div key={policy.policyId} className="bg-card rounded-lg shadow-card card-hover">
                <div className="p-6 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">{policy.insurer}</h3>
                        <p className="text-sm text-muted-foreground">{policy.policyType}</p>
                      </div>
                    </div>
                    <StatusBadge status={policy.status} type="policy" />
                  </div>
                </div>
                <div className="px-6 pb-6 space-y-4">
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
                    <button
                      onClick={() => openEditModal(policy)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-input rounded-md hover:bg-secondary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Policy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-card rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">
                    {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="insurer" className="block text-sm font-medium text-foreground">
                      Insurer Name
                    </label>
                    <input
                      id="insurer"
                      name="insurer"
                      value={formData.insurer}
                      onChange={handleChange}
                      placeholder="e.g., State Farm"
                      className={`w-full h-10 px-3 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.insurer ? 'border-destructive' : 'border-input'
                      }`}
                    />
                    {errors.insurer && (
                      <p className="text-xs text-destructive">{errors.insurer}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="policyType" className="block text-sm font-medium text-foreground">
                      Policy Type
                    </label>
                    <div className="relative">
                      <select
                        id="policyType"
                        name="policyType"
                        value={formData.policyType}
                        onChange={handleChange}
                        className={`w-full h-10 px-3 pr-8 rounded-md border bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer ${
                          errors.policyType ? 'border-destructive' : 'border-input'
                        }`}
                      >
                        <option value="">Select type</option>
                        {policyTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.policyType && (
                      <p className="text-xs text-destructive">{errors.policyType}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="premiumAmt" className="block text-sm font-medium text-foreground">
                      Premium Amount ($)
                    </label>
                    <input
                      id="premiumAmt"
                      name="premiumAmt"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.premiumAmt || ''}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full h-10 px-3 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.premiumAmt ? 'border-destructive' : 'border-input'
                      }`}
                    />
                    {errors.premiumAmt && (
                      <p className="text-xs text-destructive">{errors.premiumAmt}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
                        Start Date
                      </label>
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`w-full h-10 px-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.startDate ? 'border-destructive' : 'border-input'
                        }`}
                      />
                      {errors.startDate && (
                        <p className="text-xs text-destructive">{errors.startDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="endDate" className="block text-sm font-medium text-foreground">
                        End Date
                      </label>
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`w-full h-10 px-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.endDate ? 'border-destructive' : 'border-input'
                        }`}
                      />
                      {errors.endDate && (
                        <p className="text-xs text-destructive">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {editingPolicy && (
                    <div className="space-y-2">
                      <label htmlFor="status" className="block text-sm font-medium text-foreground">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full h-10 px-3 pr-8 rounded-md border border-input bg-background text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                        >
                          {policyStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  )}

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
                          {editingPolicy ? 'Updating...' : 'Creating...'}
                        </>
                      ) : editingPolicy ? (
                        'Update Policy'
                      ) : (
                        'Create Policy'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Policies;
