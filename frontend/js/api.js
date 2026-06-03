const API_URL = `${window.location.origin}/api`;

class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: this.getHeaders()
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ошибка запроса');
        }
        
        return result;
    }

    // Auth methods
    async login(username, password) {
        const result = await this.request('/auth/login', 'POST', { username, password });
        this.setToken(result.token);
        return result.user;
    }

    async register(username, password, fullName, role) {
        return await this.request('/auth/register', 'POST', { username, password, fullName, role });
    }

    logout() {
        this.setToken(null);
    }

    // Categories
    async getCategories() {
        return await this.request('/categories');
    }

    // Requests methods
    async getRequests(filters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') params.append(key, value);
        });
        const query = params.toString();
        return await this.request(query ? `/requests?${query}` : '/requests');
    }

    async getRequest(id) {
        return await this.request(`/requests/${id}`);
    }

    async createRequest(title, description, priority, categoryId) {
        return await this.request('/requests', 'POST', {
            title,
            description,
            priority,
            category_id: categoryId || null
        });
    }

    async deleteRequest(id) {
        return await this.request(`/requests/${id}`, 'DELETE');
    }

    async updateRequest(id, data) {
        return await this.request(`/requests/${id}`, 'PUT', data);
    }

    // Comments methods
    async getComments(requestId) {
        return await this.request(`/requests/${requestId}/comments`);
    }

    async addComment(requestId, comment) {
        return await this.request(`/requests/${requestId}/comments`, 'POST', { comment });
    }

    // Status history
    async getStatusHistory(requestId) {
        return await this.request(`/requests/${requestId}/history`);
    }

    // Statistics
    async getStatistics() {
        return await this.request('/statistics');
    }

    // Users
    async getITSpecialists() {
        return await this.request('/users/it-specialists');
    }
}

const api = new API();