const API_URLS = {
  announcements: 'https://functions.poehali.dev/b1e181c0-55b3-4324-acd5-0006dbf5513b',
  responses: 'https://functions.poehali.dev/76351e81-d861-498b-a2a8-e7aed5a2df02',
  payments: 'https://functions.poehali.dev/df01d173-dc03-4599-89e8-ad9b742e4b60'
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
  }): Promise<{ success: boolean; announcement_id: number; amount: number }> {
    const response = await fetch(API_URLS.payments, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_payment', ...data })
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
