interface StatusBadgeProps {
  status: string;
  type?: 'policy' | 'claim';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'policy' }) => {
  const getStatusClass = () => {
    const normalizedStatus = status.toLowerCase();
    
    if (type === 'policy') {
      switch (normalizedStatus) {
        case 'active':
          return 'status-active';
        case 'lapsed':
          return 'status-lapsed';
        case 'cancelled':
          return 'status-rejected';
        default:
          return 'status-lapsed';
      }
    } else {
      switch (normalizedStatus) {
        case 'approved':
          return 'status-active';
        case 'submitted':
        case 'under review':
          return 'status-pending';
        case 'rejected':
          return 'status-rejected';
        default:
          return 'status-lapsed';
      }
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
