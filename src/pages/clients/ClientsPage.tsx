import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import type { Client } from '@/types';

// Mock data
const mockClients: Client[] = [
  {
    id: '1',
    email: 'sarah.johnson@email.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'client',
    coachId: 'coach1',
    goals: 'Lose 20 lbs, build strength',
    startDate: '2024-01-15',
    currentWeight: 165,
    targetWeight: 145,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'mike.williams@email.com',
    firstName: 'Mike',
    lastName: 'Williams',
    role: 'client',
    coachId: 'coach1',
    goals: 'Build muscle, improve endurance',
    startDate: '2024-02-01',
    currentWeight: 185,
    targetWeight: 175,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'emily.davis@email.com',
    firstName: 'Emily',
    lastName: 'Davis',
    role: 'client',
    coachId: 'coach1',
    goals: 'Marathon training',
    startDate: '2024-02-15',
    currentWeight: 135,
    targetWeight: 130,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
];

export function ClientsPage() {
  const navigate = useNavigate();
  const [clients] = useState<Client[]>(mockClients);

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Client',
      cell: (client) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={client.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {client.firstName[0]}{client.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{client.firstName} {client.lastName}</p>
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'goals',
      header: 'Goals',
      cell: (client) => (
        <p className="text-sm text-muted-foreground max-w-[200px] truncate">
          {client.goals || 'No goals set'}
        </p>
      ),
    },
    {
      key: 'weight',
      header: 'Progress',
      cell: (client) => {
        const progress = client.currentWeight && client.targetWeight
          ? Math.round(((client.currentWeight - client.targetWeight) / client.targetWeight) * 100)
          : null;
        return (
          <div className="text-sm">
            <p className="font-medium">{client.currentWeight} lbs</p>
            {progress !== null && (
              <p className={progress > 0 ? 'text-destructive' : 'text-vitality'}>
                {progress > 0 ? '+' : ''}{progress}% from goal
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'startDate',
      header: 'Start Date',
      cell: (client) => (
        <span className="text-sm text-muted-foreground">
          {new Date(client.startDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: () => (
        <Badge className="bg-vitality/20 text-vitality border-0">Active</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>
              Edit Client
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        description="Manage your clients and track their progress."
        actions={
          <Button onClick={() => navigate('/clients/new')} className="shadow-energy">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        }
      />

      <DataTable
        data={clients}
        columns={columns}
        searchPlaceholder="Search clients..."
        searchKey="firstName"
        onRowClick={(client) => navigate(`/clients/${client.id}`)}
        emptyMessage="No clients found. Add your first client to get started!"
      />
    </div>
  );
}

export default ClientsPage;
