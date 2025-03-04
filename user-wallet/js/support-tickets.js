
class TicketManager {
    constructor() {
        this.initializeDropzone();
        this.initializeEventListeners();
        this.loadTickets();
        this.loadKnowledgeBase();
    }

    initializeDropzone() {
        // Initialize Dropzone for new ticket attachments
        this.ticketDropzone = new Dropzone("#ticketAttachments", {
            url: "/api/upload",
            maxFiles: 5,
            maxFilesize: 5, // MB
            acceptedFiles: "image/*,application/pdf",
            addRemoveLinks: true,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Initialize Dropzone for reply attachments
        this.replyDropzone = new Dropzone("#replyAttachments", {
            url: "/api/upload",
            maxFiles: 3,
            maxFilesize: 5, // MB
            acceptedFiles: "image/*,application/pdf",
            addRemoveLinks: true,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Handle upload success
        this.ticketDropzone.on("success", this.handleUploadSuccess.bind(this));
        this.replyDropzone.on("success", this.handleUploadSuccess.bind(this));

        // Handle upload error
        this.ticketDropzone.on("error", this.handleUploadError.bind(this));
        this.replyDropzone.on("error", this.handleUploadError.bind(this));
    }

    async loadTickets() {
        try {
            const response = await fetch('/api/tickets', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load tickets');

            const data = await response.json();
            this.renderTickets(data.tickets);
            this.updateStats(data.stats);
        } catch (error) {
            this.showToast('error', 'Failed to load tickets');
        }
    }

    async loadKnowledgeBase() {
        try {
            const response = await fetch('/api/knowledge-base/popular', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to load knowledge base');

            const articles = await response.json();
            this.renderKnowledgeBase(articles);
        } catch (error) {
            this.showToast('error', 'Failed to load knowledge base articles');
        }
    }

    async createTicket(formData) {
        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create ticket');

            this.showToast('success', 'Ticket created successfully');
            this.loadTickets();
            return true;
        } catch (error) {
            this.showToast('error', 'Failed to create ticket');
            return false;
        }
    }

    async updateTicketStatus(ticketId, status) {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update ticket status');

            this.showToast('success', 'Ticket status updated successfully');
            this.loadTickets();
        } catch (error) {
            this.showToast('error', 'Failed to update ticket status');
        }
    }

    handleUploadSuccess(file, response) {
        const attachmentData = JSON.parse(response);
        file.attachmentId = attachmentData.id;
        this.showToast('success', 'File uploaded successfully');
    }

    handleUploadError(file, message) {
        this.showToast('error', `Upload failed: ${message}`);
    }

    showToast(type, message) {
        const toast = new bootstrap.Toast(document.getElementById(`${type}Toast`));
        document.querySelector(`#${type}Toast .toast-body`).textContent = message;
        toast.show();
    }

    renderTickets(tickets) {
        const container = document.getElementById('ticketsList');
        container.innerHTML = tickets.map(ticket => this.createTicketCard(ticket)).join('');
    }

    createTicketCard(ticket) {
        return `
            <div class="col-md-6 mb-4">
                <div class="card ticket-card priority-${ticket.priority}" 
                     data-ticket-id="${ticket.id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title">${this.escapeHtml(ticket.subject)}</h5>
                            <span class="badge bg-${this.getPriorityColor(ticket.priority)}">
                                ${ticket.priority.toUpperCase()}
                            </span>
                        </div>
                        <p class="card-text">${this.escapeHtml(ticket.description)}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-${this.getStatusColor(ticket.status)}">
                                ${ticket.status}
                            </span>
                            <small class="text-muted">
                                ${this.formatDate(ticket.created_at)}
                            </small>
                        </div>
                        ${this.renderAttachments(ticket.attachments)}
                    </div>
                </div>
            </div>
        `;
    }

    renderAttachments(attachments) {
        if (!attachments || attachments.length === 0) return '';

        return `
            <div class="attachment-preview-container mt-2">
                ${attachments.map(attachment => `
                    <div class="attachment-preview">
                        ${this.isImage(attachment.type) 
                            ? `<img src="${attachment.url}" alt="attachment">`
                            : `<i class="bi bi-file-earmark-text fs-1"></i>`
                        }
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateStats(stats) {
        document.getElementById('totalTickets').textContent = stats.total;
        document.getElementById('resolvedTickets').textContent = stats.resolved;
        document.getElementById('pendingTickets').textContent = stats.pending;
        document.getElementById('avgResponseTime').textContent = stats.avgResponseTime;
    }

    initializeEventListeners() {
        // New Ticket Form
        document.getElementById('newTicketForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const attachments = this.ticketDropzone.getAcceptedFiles().map(file => file.attachmentId);
            formData.append('attachments', JSON.stringify(attachments));
    
 // Convert FormData to a plain object
 const formObject = Object.fromEntries(formData.entries());

 const success = await this.createTicket(formObject);
 if (success) {
     e.target.reset();
     this.ticketDropzone.removeAllFiles();
 }
