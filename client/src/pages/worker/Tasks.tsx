import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const WorkerTasks = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-6">Today's Assigned Route</h1>
      
      {[
        {id: 'CIV-2033', type: 'Pothole Repair', address: 'Sector V, Near SDF Building', status: 'ASSIGNED', priority: 'High'},
        {id: 'CIV-1982', type: 'Fallen Tree', address: 'Park Street Crossing', status: 'IN_PROGRESS', priority: 'Critical'},
      ].map(task => (
        <GlassCard key={task.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-sm font-bold text-gray-500">{task.id}</span>
                 <Badge color={task.priority === 'Critical' ? 'red' : 'orange'}>{task.priority}</Badge>
              </div>
              <h3 className="text-xl font-bold">{task.type}</h3>
              <p className="text-gray-500 text-sm mt-1">📍 {task.address}</p>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              {task.status === 'ASSIGNED' ? (
                 <Button className="w-full md:w-auto">Start Job</Button>
              ) : (
                 <Button className="w-full md:w-auto !bg-apple-green">Upload Proof & Resolve</Button>
              )}
           </div>
        </GlassCard>
      ))}
    </div>
  );
};
