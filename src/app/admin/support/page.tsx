'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminSupportPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    loadAdminData();
    
    // Set up real-time subscriptions
    const subscription = supabase
      .channel('support-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        loadTickets();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_ticket_responses' }, () => {
        if (selectedTicket) {
          loadTicketResponses(selectedTicket.id);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAdminData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', authUser.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }

      setUser(authUser);
      await loadTickets();
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select(`
          *,
          assigned_admin:assigned_to (username, email)
        `)
        .order('created_at', { ascending: false });

      setTickets(ticketsData || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const loadTicketResponses = async (ticketId: string) => {
    try {
      const { data: responsesData } = await supabase
        .from('support_ticket_responses')
        .select(`
          *,
          admin:user_id (username, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      setResponses(responsesData || []);
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    loadTicketResponses(ticket.id);
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      await loadTickets();
      
      // Update selected ticket if it's the one we modified
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId);
        if (updatedTicket) {
          setSelectedTicket({ ...updatedTicket, ...updateData });
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleAssignTicket = async (ticketId: string, adminId: string | null) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      await loadTickets();
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, assigned_to: adminId }));
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert('Failed to assign ticket');
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) {
      return;
    }

    setResponding(true);

    try {
      const { error } = await supabase
        .from('support_ticket_responses')
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: responseText.trim(),
          is_admin_response: true
        }]);

      if (error) throw error;

      // Update ticket status to waiting_user if it was open
      if (selectedTicket.status === 'open') {
        await handleUpdateTicketStatus(selectedTicket.id, 'waiting_user');
      }

      setResponseText('');
      await loadTicketResponses(selectedTicket.id);
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Failed to send response');
    } finally {
      setResponding(false);
    }
  };

  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      
      // Priority filter
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
      
      // Category filter
      if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          ticket.subject,
          ticket.message,
          ticket.user_email,
          ticket.user_name
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) return false;
      }
      
      return true;
    });
  };

  const getTicketStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const waiting = tickets.filter(t => t.status === 'waiting_user').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    
    return { total, open, inProgress, waiting, resolved };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredTickets = getFilteredTickets();
  const stats = getTicketStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Ticket Management</h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            Manage and respond to user support requests
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Tickets</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.open}</div>
          <div className="text-sm text-red-700 dark:text-red-300">Open</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">In Progress</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.waiting}</div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Waiting User</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</div>
          <div className="text-sm text-green-700 dark:text-green-300">Resolved</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_user">Waiting User</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="payment">Payment</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="game">Game/Technical</option>
                  <option value="account">Account</option>
                  <option value="legal">Legal</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Support Tickets ({filteredTickets.length})
              </h2>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredTickets.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                        selectedTicket?.id === ticket.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {ticket.subject}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              ticket.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {ticket.user_name || ticket.user_email} • {ticket.category}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {new Date(ticket.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ticket.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          ticket.status === 'waiting_user' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No tickets found matching your filters
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Detail */}
        <div>
          {selectedTicket ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Details</h2>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Status and Assignment Controls */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_user">Waiting User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                    <select
                      value={selectedTicket.assigned_to || ''}
                      onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Unassigned</option>
                      <option value={user.id}>Assign to me</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ticket Content */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{selectedTicket.subject}</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <p><strong>From:</strong> {selectedTicket.user_name || 'Unknown'} ({selectedTicket.user_email})</p>
                  <p><strong>Category:</strong> {selectedTicket.category}</p>
                  <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                  <p><strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {selectedTicket.message.split('\n').map((line: string, index: number) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>

              {/* Responses */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Responses</h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {responses.map((response) => (
                    <div key={response.id} className={`p-3 rounded-lg ${
                      response.is_admin_response 
                        ? 'bg-blue-50 dark:bg-blue-900/20 ml-4' 
                        : 'bg-gray-50 dark:bg-gray-900/50 mr-4'
                    }`}>
                      <div className="text-xs text-gray-500 mb-1">
                        {response.is_admin_response ? 'Admin' : 'User'} • {new Date(response.created_at).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {response.message}
                      </div>
                    </div>
                  ))}
                  {responses.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">No responses yet</p>
                  )}
                </div>
              </div>

              {/* Response Form */}
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Send Response</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Type your response to the user..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSendResponse}
                    disabled={responding || !responseText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {responding ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-lg font-medium mb-2">Select a Ticket</h3>
                <p className="text-sm">Choose a support ticket from the list to view details and respond</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}