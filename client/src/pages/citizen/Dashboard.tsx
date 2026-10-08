import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../hooks/queries';

export const CitizenDashboard = () => {
  const { data: complaints, isLoading } = useComplaints();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold mb-2">My Overview</h1>
            <p className="text-gray-500">Track and manage your community reports.</p>
         </div>
         <Link to="/citizen/report">
            <Button className="flex items-center gap-2"><PlusCircle size={18}/> New Report</Button>
         </Link>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div></div></div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Reported</h3>
              <p className="text-4xl font-bold">{complaints?.length || 0}</p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">In Progress</h3>
              <p className="text-4xl font-bold text-apple-orange">
                {complaints?.filter((c:any) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length || 0}
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Resolved</h3>
              <p className="text-4xl font-bold text-apple-green">
                {complaints?.filter((c:any) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length || 0}
              </p>
            </GlassCard>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-6">Recent Activity (Real DB)</h2>
          <div className="space-y-4">
             {complaints?.slice(0, 5).map((item: any) => (
                <GlassCard key={item.id} className="flex justify-between items-center p-6">
                   <div>
                     <div className="flex items-center gap-3 mb-1">
                       <span className="text-sm font-bold text-gray-500">{item.publicId}</span>
                       <h4 className="text-lg font-semibold">{item.category?.name || 'Issue'}</h4>
                     </div>
                     <p className="text-sm text-gray-500 truncate max-w-md">{item.description}</p>
                   </div>
                   <Badge color={item.status === 'RESOLVED' ? 'green' : 'blue'}>{item.status.replace('_', ' ')}</Badge>
                </GlassCard>
             ))}
          </div>
        </>
      )}
    </div>
  );
};
