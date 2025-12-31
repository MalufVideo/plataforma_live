import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Send,
  Check,
  X,
  Clock,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Download,
  Filter,
} from 'lucide-react';
import {
  getMyParties,
  createParty,
  updateParty,
  deleteParty,
  getPartyInvitations,
  inviteGuest,
  bulkInviteGuests,
  deleteInvitation,
  sendReminderToGuest,
} from '../services/supabaseService';
import { Party, PartyInvitation, PartyStatus, InvitationStatus } from '../types';

export const PartyManagementPage: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [invitations, setInvitations] = useState<PartyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Form states
  const [partyForm, setPartyForm] = useState({
    title: '',
    description: '',
    partyDate: '',
    location: '',
    maxGuests: 50,
    status: 'DRAFT' as PartyStatus,
  });

  const [guestForm, setGuestForm] = useState({
    email: '',
    name: '',
  });

  const [bulkInviteText, setBulkInviteText] = useState('');

  useEffect(() => {
    loadParties();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      loadInvitations(selectedParty.id);
    }
  }, [selectedParty]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const data = await getMyParties();
      setParties(data);
    } catch (error) {
      console.error('Failed to load parties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async (partyId: string) => {
    try {
      const data = await getPartyInvitations(partyId);
      setInvitations(data);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleCreateParty = async () => {
    try {
      const newParty = await createParty({
        ...partyForm,
        partyDate: partyForm.partyDate ? new Date(partyForm.partyDate).getTime() : undefined,
      });
      setParties([newParty, ...parties]);
      setShowCreateModal(false);
      resetPartyForm();
    } catch (error) {
      console.error('Failed to create party:', error);
      alert('Failed to create party');
    }
  };

  const handleDeleteParty = async (partyId: string) => {
    if (!confirm('Are you sure you want to delete this party? All invitations will be removed.')) {
      return;
    }
    try {
      await deleteParty(partyId);
      setParties(parties.filter(p => p.id !== partyId));
      if (selectedParty?.id === partyId) {
        setSelectedParty(null);
      }
    } catch (error) {
      console.error('Failed to delete party:', error);
      alert('Failed to delete party');
    }
  };

  const handleInviteGuest = async () => {
    if (!selectedParty || !guestForm.email) return;

    try {
      const newInvitation = await inviteGuest(selectedParty.id, guestForm.email, guestForm.name);
      setInvitations([newInvitation, ...invitations]);
      setGuestForm({ email: '', name: '' });
    } catch (error: any) {
      console.error('Failed to invite guest:', error);
      alert(error.message || 'Failed to invite guest');
    }
  };

  const handleBulkInvite = async () => {
    if (!selectedParty || !bulkInviteText.trim()) return;

    // Parse bulk text (one email per line, optional name after comma)
    const lines = bulkInviteText.split('\n').filter(l => l.trim());
    const guests = lines.map(line => {
      const [email, name] = line.split(',').map(s => s.trim());
      return { email, name };
    }).filter(g => g.email);

    if (guests.length === 0) {
      alert('Please enter at least one valid email');
      return;
    }

    try {
      await bulkInviteGuests(selectedParty.id, guests);
      await loadInvitations(selectedParty.id);
      setBulkInviteText('');
      setShowInviteModal(false);
      alert(`Successfully invited ${guests.length} guests!`);
    } catch (error: any) {
      console.error('Failed to bulk invite:', error);
      alert(error.message || 'Some invitations failed');
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Remove this guest from the party?')) return;

    try {
      await deleteInvitation(invitationId);
      setInvitations(invitations.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Failed to delete invitation:', error);
    }
  };

  const handleSendReminder = async (invitationId: string) => {
    try {
      await sendReminderToGuest(invitationId);
      await loadInvitations(selectedParty!.id);
      alert('Reminder sent!');
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const resetPartyForm = () => {
    setPartyForm({
      title: '',
      description: '',
      partyDate: '',
      location: '',
      maxGuests: 50,
      status: 'DRAFT',
    });
  };

  const getStatusBadge = (status: PartyStatus) => {
    const colors = {
      DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      PUBLISHED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      COMPLETED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return colors[status] || colors.DRAFT;
  };

  const getInvitationStatusBadge = (status: InvitationStatus) => {
    const config = {
      PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
      CONFIRMED: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      DECLINED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
      CANCELLED: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: X },
    };
    return config[status] || config.PENDING;
  };

  const getInvitationStats = () => {
    const total = invitations.length;
    const confirmed = invitations.filter(i => i.invitationStatus === 'CONFIRMED').length;
    const pending = invitations.filter(i => i.invitationStatus === 'PENDING').length;
    const declined = invitations.filter(i => i.invitationStatus === 'DECLINED').length;
    return { total, confirmed, pending, declined };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Party Management</h1>
            <p className="text-slate-400">Manage your events and guest lists</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Party
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Parties List */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xl font-bold mb-4">My Parties ({parties.length})</h2>
            {parties.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">No parties yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Create your first party
                </button>
              </div>
            ) : (
              parties.map(party => (
                <div
                  key={party.id}
                  onClick={() => setSelectedParty(party)}
                  className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedParty?.id === party.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{party.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded border ${getStatusBadge(party.status)}`}>
                      {party.status}
                    </span>
                  </div>
                  {party.partyDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(party.partyDate).toLocaleDateString()}
                    </div>
                  )}
                  {party.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-4 h-4" />
                      {party.location}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Party Details & Guests */}
          <div className="md:col-span-2">
            {selectedParty ? (
              <div className="space-y-6">
                {/* Party Info */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedParty.title}</h2>
                      <p className="text-slate-400">{selectedParty.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteParty(selectedParty.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedParty.partyDate && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                        <span>{new Date(selectedParty.partyDate).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedParty.location && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                        <span>{selectedParty.location}</span>
                      </div>
                    )}
                    {selectedParty.maxGuests && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Users className="w-5 h-5 text-indigo-400" />
                        <span>Max {selectedParty.maxGuests} guests</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guest Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total', value: getInvitationStats().total, color: 'indigo' },
                    { label: 'Confirmed', value: getInvitationStats().confirmed, color: 'green' },
                    { label: 'Pending', value: getInvitationStats().pending, color: 'amber' },
                    { label: 'Declined', value: getInvitationStats().declined, color: 'red' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <div className="text-slate-400 text-sm mb-1">{stat.label}</div>
                      <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Invite Guest */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Invite Guests</h3>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Guest email"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleInviteGuest}
                      disabled={!guestForm.email}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Invite
                    </button>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                    >
                      Bulk Invite
                    </button>
                  </div>
                </div>

                {/* Guest List */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Guest List ({invitations.length})</h3>
                  <div className="space-y-2">
                    {invitations.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p>No guests invited yet</p>
                      </div>
                    ) : (
                      invitations.map(invitation => {
                        const statusConfig = getInvitationStatusBadge(invitation.invitationStatus);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{invitation.guestName || invitation.guestEmail}</div>
                                {invitation.guestName && (
                                  <div className="text-sm text-slate-400">{invitation.guestEmail}</div>
                                )}
                              </div>
                              <div className={`px-2 py-1 text-xs rounded border flex items-center gap-1 ${statusConfig.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {invitation.invitationStatus}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {invitation.invitationStatus === 'PENDING' && (
                                <button
                                  onClick={() => handleSendReminder(invitation.id)}
                                  className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                  title="Send reminder"
                                >
                                  <Bell className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInvitation(invitation.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a party to manage guests</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Party Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Party</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={partyForm.title}
                  onChange={(e) => setPartyForm({ ...partyForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Birthday Party, Wedding, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={partyForm.description}
                  onChange={(e) => setPartyForm({ ...partyForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  rows={3}
                  placeholder="Tell guests about your party..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={partyForm.partyDate}
                  onChange={(e) => setPartyForm({ ...partyForm, partyDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
                <input
                  type="text"
                  value={partyForm.location}
                  onChange={(e) => setPartyForm({ ...partyForm, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="123 Main St, City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Guests</label>
                <input
                  type="number"
                  value={partyForm.maxGuests}
                  onChange={(e) => setPartyForm({ ...partyForm, maxGuests: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetPartyForm();
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateParty}
                disabled={!partyForm.title}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Create Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Bulk Invite Guests</h2>
            <p className="text-slate-400 mb-4 text-sm">
              Enter one email per line. Optionally add a name after a comma.
              <br />
              Example: john@email.com, John Doe
            </p>
            <textarea
              value={bulkInviteText}
              onChange={(e) => setBulkInviteText(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              rows={10}
              placeholder="guest1@email.com, Guest One&#10;guest2@email.com, Guest Two&#10;guest3@email.com"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setBulkInviteText('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkInvite}
                disabled={!bulkInviteText.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Send Invitations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
