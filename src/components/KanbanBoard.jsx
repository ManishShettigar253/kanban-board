import React, { useState, useEffect } from 'react';

const DEFAULT_STATUSES = ['Todo', 'In Progress', 'Done', 'Cancelled'];
const DEFAULT_PRIORITIES = [
  { id: 4, label: 'Urgent' },
  { id: 3, label: 'High' },
  { id: 2, label: 'Medium' },
  { id: 1, label: 'Low' },
  { id: 0, label: 'No priority' }
];

const KanbanBoard = () => {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [grouping, setGrouping] = useState('status');
  const [sorting, setSorting] = useState('priority');
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    status: 'Todo',
    priority: 0,
    userId: '',
    tag: ''
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.quicksell.co/v1/internal/frontend-assignment');
        const data = await response.json();
        setTickets(data.tickets);
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Load saved state from localStorage
  useEffect(() => {
    const savedStatuses = localStorage.getItem('kanbanStatuses');
    const savedGrouping = localStorage.getItem('kanbanGrouping');
    const savedSorting = localStorage.getItem('kanbanSorting');

    if (savedStatuses) setStatuses(JSON.parse(savedStatuses));
    if (savedGrouping) setGrouping(savedGrouping);
    if (savedSorting) setSorting(savedSorting);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('kanbanStatuses', JSON.stringify(statuses));
    localStorage.setItem('kanbanGrouping', grouping);
    localStorage.setItem('kanbanSorting', sorting);
  }, [statuses, grouping, sorting]);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'todo': return '○';
      case 'in progress': return '◐';
      case 'done': return '●';
      case 'cancelled': return '×';
      default: return '○';
    }
  };

  const getPriorityLabel = (priority) => {
    return DEFAULT_PRIORITIES.find(p => p.id === priority)?.label || 'No priority';
  };

  // Group tickets
  const groupedTickets = React.useMemo(() => {
    if (!tickets.length) return {};

    return tickets.reduce((acc, ticket) => {
      const key = grouping === 'status' ? ticket.status :
                 grouping === 'user' ? ticket.userId :
                 grouping === 'priority' ? ticket.priority.toString() :
                 'other';
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ticket);
      return acc;
    }, {});
  }, [tickets, grouping]);

  // Sort tickets
  const sortTickets = (ticketsToSort) => {
    return [...ticketsToSort].sort((a, b) => {
      if (sorting === 'priority') return b.priority - a.priority;
      if (sorting === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  };

  // Add new column
  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      setStatuses([...statuses, newColumnTitle]);
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  // Remove column
  const handleRemoveColumn = (status) => {
    if (window.confirm(`Are you sure you want to remove the "${status}" column?`)) {
      setStatuses(statuses.filter(s => s !== status));
      setTickets(tickets.filter(t => t.status !== status));
    }
  };

  // Add new ticket
  const handleAddTicket = () => {
    if (newTicket.title.trim()) {
      const ticketToAdd = {
        ...newTicket,
        id: `CAM-${tickets.length + 1}`,
        userId: newTicket.userId || users[0]?.id
      };
      setTickets([...tickets, ticketToAdd]);
      setNewTicket({
        title: '',
        status: 'Todo',
        priority: 0,
        userId: '',
        tag: ''
      });
      setIsAddingTicket(false);
    }
  };

  // Edit ticket
  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setNewTicket(ticket);
  };

  // Update ticket
  const handleUpdateTicket = () => {
    setTickets(tickets.map(t => 
      t.id === selectedTicket.id ? { ...t, ...newTicket } : t
    ));
    setSelectedTicket(null);
    setNewTicket({
      title: '',
      status: 'Todo',
      priority: 0,
      userId: '',
      tag: ''
    });
  };

  // Delete ticket
  const handleDeleteTicket = (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      setTickets(tickets.filter(t => t.id !== ticketId));
    }
  };

  // Move ticket between columns
  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    const updatedTickets = tickets.map(ticket =>
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    );
    setTickets(updatedTickets);
  };

  return (
    <div className="kanban-container">
      {/* Header Controls */}
      <div className="kanban-header">
        <div className="display-dropdown">
          <button className="display-button" onClick={() => setIsDisplayOpen(!isDisplayOpen)}>
            <span>Display</span>
            <span className="chevron-down"></span>
          </button>

          {isDisplayOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <label>Grouping</label>
                <select value={grouping} onChange={(e) => setGrouping(e.target.value)}>
                  <option value="status">Status</option>
                  <option value="user">User</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              <div className="dropdown-section">
                <label>Ordering</label>
                <select value={sorting} onChange={(e) => setSorting(e.target.value)}>
                  <option value="priority">Priority</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button className="add-button" onClick={() => setIsAddingTicket(true)}>
          Add Ticket
        </button>
        <button className="add-button" onClick={() => setIsAddingColumn(true)}>
          Add Column
        </button>
      </div>

      {/* Add Column Dialog */}
      {isAddingColumn && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Column</h3>
            <input
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Column Title"
            />
            <div className="modal-actions">
              <button onClick={handleAddColumn}>Add</button>
              <button onClick={() => setIsAddingColumn(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Ticket Dialog */}
      {(isAddingTicket || selectedTicket) && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedTicket ? 'Edit Ticket' : 'Add New Ticket'}</h3>
            <input
              type="text"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              placeholder="Ticket Title"
            />
            <select
              value={newTicket.status}
              onChange={(e) => setNewTicket({ ...newTicket, status: e.target.value })}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: Number(e.target.value) })}
            >
              {DEFAULT_PRIORITIES.map(priority => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </select>
            <select
              value={newTicket.userId}
              onChange={(e) => setNewTicket({ ...newTicket, userId: e.target.value })}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={newTicket.tag}
              onChange={(e) => setNewTicket({ ...newTicket, tag: e.target.value })}
              placeholder="Tag"
            />
            <div className="modal-actions">
              <button onClick={selectedTicket ? handleUpdateTicket : handleAddTicket}>
                {selectedTicket ? 'Update' : 'Add'}
              </button>
              <button onClick={() => {
                setIsAddingTicket(false);
                setSelectedTicket(null);
                setNewTicket({
                  title: '',
                  status: 'Todo',
                  priority: 0,
                  userId: '',
                  tag: ''
                });
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="kanban-board">
        {statuses.map(status => (
          <div
            key={status}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="column-header">
              <div className="header-left">
                <span className="status-icon">{getStatusIcon(status)}</span>
                <h2>
                  {status}
                  <span className="ticket-count">
                    {tickets.filter(t => t.status === status).length}
                  </span>
                </h2>
              </div>
              <div className="header-actions">
                <button className="icon-button" onClick={() => setIsAddingTicket(true)}>+</button>
                <button
                  className="icon-button"
                  onClick={() => handleRemoveColumn(status)}
                >×</button>
              </div>
            </div>

            <div className="ticket-container">
              {sortTickets(tickets.filter(t => t.status === status)).map(ticket => (
                <div
                  key={ticket.id}
                  className={`ticket priority-${ticket.priority}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ticket.id)}
                >
                  <div className="ticket-header">
                    <span className="ticket-id">{ticket.id}</span>
                    <div className="ticket-actions">
                      <button
                        className="icon-button"
                        onClick={() => handleEditTicket(ticket)}
                      >✎</button>
                      <button
                        className="icon-button"
                        onClick={() => handleDeleteTicket(ticket.id)}
                      >×</button>
                    </div>
                  </div>
                  <h3 className="ticket-title">{ticket.title}</h3>
                  <div className="ticket-tags">
                    <span className="priority-tag">
                      {getPriorityLabel(ticket.priority)}
                    </span>
                    {ticket.tag && (
                      <span className="feature-tag">{ticket.tag}</span>
                    )}
                  </div>
                  <div className="user-avatar">
                    {users.find(u => u.id === ticket.userId)?.name.charAt(0) || '?'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;