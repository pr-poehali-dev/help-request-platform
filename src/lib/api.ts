const API_URLS = {
  announcements: 'https://functions.poehali.dev/b1e181c0-55b3-4324-acd5-0006dbf5513b',
  responses: 'https://functions.poehali.dev/76351e81-d861-498b-a2a8-e7aed5a2df02',
  payments: 'https://functions.poehali.dev/df01d173-dc03-4599-89e8-ad9b742e4b60',
  donations: 'https://functions.poehali.dev/b466acd0-0691-4e63-8c9d-9eacbd7dbefb',
  celebrities: 'https://functions.poehali.dev/c68b9bfa-7cd0-4dcf-bb6d-56adfb2ac06b'
};

export interface Announcement {
  id: number;
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  type: 'regular' | 'boosted' | 'vip';
  status: string;
  views: number;
}

export interface Response {
  id: number;
  responder_name: string;
  responder_contact: string;
  message: string;
  created_at: string;
  status: string;
  message_count: number;
}

export interface Message {
  id: number;
  sender: string;
  message: string;
  created_at: string;
}

export const announcementsApi = {
  async getAll(): Promise<Announcement[]> {
    const response = await fetch(API_URLS.announcements);
    if (!response.ok) throw new Error('Failed to fetch announcements');
    return response.json();
  },

  async trackView(id: number): Promise<void> {
    await fetch(`${API_URLS.announcements}?id=${id}&track_view=1`);
  },

  async trackVisit(): Promise<void> {
    await fetch(API_URLS.announcements, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'track_visit' })
    });
  },

  async getStats(admin_code: string): Promise<{
    total_visits: number;
    unique_visitors: number;
    today_visits: number;
    total_announcement_views: number;
  }> {
    const response = await fetch(API_URLS.announcements, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_stats', admin_code })
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getByAuthor(author: string): Promise<Announcement[]> {
    const response = await fetch(`${API_URLS.announcements}?author=${encodeURIComponent(author)}`);
    if (!response.ok) throw new Error('Failed to fetch announcements');
    return response.json();
  },

  async close(id: number): Promise<void> {
    const response = await fetch(API_URLS.announcements, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', id })
    });
    if (!response.ok) throw new Error('Failed to close announcement');
  }
};

export const paymentsApi = {
  async createPayment(data: {
    title: string;
    description: string;
    category: string;
    author_name: string;
    author_contact: string;
    type: 'regular' | 'boosted' | 'vip';
  }): Promise<{ 
    success: boolean; 
    announcement_id: number; 
    amount: number;
    payment_url?: string;
    yoomoney_card?: string;
    payment_status: string;
    message?: string;
  }> {
    const response = await fetch(API_URLS.payments, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'create_payment', 
        return_url: window.location.origin,
        ...data 
      })
    });
    if (!response.ok) throw new Error('Failed to create payment');
    return response.json();
  },

  async checkPayment(announcement_id: number): Promise<{ payment_status: string; amount: number }> {
    const response = await fetch(API_URLS.payments, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_payment', announcement_id })
    });
    if (!response.ok) throw new Error('Failed to check payment');
    return response.json();
  },

  isPaid(status: string): boolean {
    return status === 'paid';
  },

  isPending(status: string): boolean {
    return status === 'pending';
  },

  async confirmPayment(announcement_id: number, admin_code: string): Promise<{ success: boolean }> {
    const response = await fetch(API_URLS.payments, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm_payment', announcement_id, admin_code })
    });
    if (!response.ok) throw new Error('Failed to confirm payment');
    return response.json();
  }
};

export const responsesApi = {
  async getByAnnouncement(announcement_id: number): Promise<Response[]> {
    const response = await fetch(`${API_URLS.responses}?announcement_id=${announcement_id}`);
    if (!response.ok) throw new Error('Failed to fetch responses');
    return response.json();
  },

  async createResponse(data: {
    announcement_id: number;
    responder_name: string;
    responder_contact: string;
    message: string;
  }): Promise<{ success: boolean; response_id: number }> {
    const response = await fetch(API_URLS.responses, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_response', ...data })
    });
    if (!response.ok) throw new Error('Failed to create response');
    return response.json();
  },

  async getMessages(response_id: number): Promise<Message[]> {
    const response = await fetch(`${API_URLS.responses}?response_id=${response_id}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async sendMessage(data: {
    response_id: number;
    sender_name: string;
    message: string;
  }): Promise<{ success: boolean; message_id: number }> {
    const response = await fetch(API_URLS.responses, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_message', ...data })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  }
};

export interface Donation {
  id: number;
  donor_name: string;
  donor_contact?: string;
  amount: number;
  message: string;
  payment_status: string;
  assigned_to?: string;
  admin_notes?: string;
  created_at: string;
}

export const donationsApi = {
  async getAll(admin_code?: string): Promise<Donation[]> {
    const url = admin_code 
      ? `${API_URLS.donations}?admin_code=${admin_code}`
      : API_URLS.donations;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch donations');
    return response.json();
  },

  async createDonation(data: {
    donor_name: string;
    donor_contact: string;
    amount: number;
    message: string;
  }): Promise<{
    success: boolean;
    donation_id: number;
    payment_url: string;
    yoomoney_card: string;
  }> {
    const response = await fetch(API_URLS.donations, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_donation', ...data })
    });
    if (!response.ok) throw new Error('Failed to create donation');
    return response.json();
  },

  async assignDonation(donation_id: number, assigned_to: string, admin_notes: string, admin_code: string): Promise<{ success: boolean }> {
    const response = await fetch(API_URLS.donations, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign_donation', donation_id, assigned_to, admin_notes, admin_code })
    });
    if (!response.ok) throw new Error('Failed to assign donation');
    return response.json();
  }
};

export interface CelebrityRequest {
  id: number;
  requester_name: string;
  requester_contact?: string;
  celebrity_name: string;
  request_text: string;
  status: string;
  admin_notes?: string;
  created_at: string;
}

export const celebritiesApi = {
  async getAll(admin_code?: string): Promise<CelebrityRequest[]> {
    const url = admin_code
      ? `${API_URLS.celebrities}?admin_code=${admin_code}`
      : API_URLS.celebrities;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch celebrity requests');
    return response.json();
  },

  async createRequest(data: {
    requester_name: string;
    requester_contact: string;
    celebrity_name: string;
    request_text: string;
  }): Promise<{ success: boolean; request_id: number; message: string }> {
    const response = await fetch(API_URLS.celebrities, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_request', ...data })
    });
    if (!response.ok) throw new Error('Failed to create request');
    return response.json();
  },

  async updateStatus(request_id: number, status: string, admin_notes: string, admin_code: string): Promise<{ success: boolean }> {
    const response = await fetch(API_URLS.celebrities, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', request_id, status, admin_notes, admin_code })
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  }
};