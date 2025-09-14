// AI Chatbot for Retail Management
class AIChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.createChatbotButton();
        this.createChatbotModal();
        this.setupEventListeners();
    }

    createChatbotButton() {
        const chatButton = document.createElement('div');
        chatButton.id = 'ai-chatbot-button';
        chatButton.className = 'ai-chatbot-button';
        chatButton.innerHTML = `
            <div class="chatbot-icon">
                <i class="bi bi-robot"></i>
            </div>
            <div class="chatbot-tooltip">Ask AI Assistant</div>
        `;
        
        const styles = `
            .ai-chatbot-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
                z-index: 1000;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            }
            
            .ai-chatbot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0, 123, 255, 0.4);
            }
            
            .ai-chatbot-button .chatbot-icon {
                color: white;
                font-size: 24px;
            }
            
            .ai-chatbot-button .chatbot-tooltip {
                position: absolute;
                right: 70px;
                top: 50%;
                transform: translateY(-50%);
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .ai-chatbot-button:hover .chatbot-tooltip {
                opacity: 1;
                visibility: visible;
            }
            
            .ai-chatbot-button .chatbot-tooltip::after {
                content: '';
                position: absolute;
                left: 100%;
                top: 50%;
                transform: translateY(-50%);
                border: 5px solid transparent;
                border-left-color: #333;
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3); }
                50% { box-shadow: 0 4px 20px rgba(0, 123, 255, 0.6); }
                100% { box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3); }
            }
            
            @media (max-width: 768px) {
                .ai-chatbot-button {
                    bottom: 15px;
                    right: 15px;
                    width: 50px;
                    height: 50px;
                }
                
                .ai-chatbot-button .chatbot-icon {
                    font-size: 20px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        document.body.appendChild(chatButton);
    }

    createChatbotModal() {
        const chatModal = document.createElement('div');
        chatModal.id = 'ai-chatbot-modal';
        chatModal.className = 'ai-chatbot-modal';
        chatModal.innerHTML = `
            <div class="chatbot-container">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">
                            <i class="bi bi-robot"></i>
                        </div>
                        <div class="chatbot-title">
                            <h6>AI Retail Assistant</h6>
                            <small class="text-muted">Online • Ready to help</small>
                        </div>
                    </div>
                    <button class="chatbot-close" id="closeChatbot">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="message bot-message">
                        <div class="message-avatar">
                            <i class="bi bi-robot"></i>
                        </div>
                        <div class="message-content">
                            <p>👋 Hello! I'm your AI retail assistant. I can help you with:</p>
                            <ul>
                                <li>📊 Business analytics and insights</li>
                                <li>📦 Inventory management advice</li>
                                <li>💰 Sales optimization tips</li>
                                <li>📈 Performance analysis</li>
                                <li>❓ General retail questions</li>
                            </ul>
                            <p>What would you like to know about your business?</p>
                        </div>
                    </div>
                </div>
                
                <div class="chatbot-input-area">
                    <div class="chatbot-suggestions" id="chatbotSuggestions">
                        <button class="suggestion-btn" data-message="What are my top selling products?">
                            📊 Top Products
                        </button>
                        <button class="suggestion-btn" data-message="How is my business performing this month?">
                            📈 Performance
                        </button>
                        <button class="suggestion-btn" data-message="Which products need restocking?">
                            📦 Low Stock
                        </button>
                        <button class="suggestion-btn" data-message="Give me sales optimization tips">
                            💡 Tips
                        </button>
                    </div>
                    <div class="chatbot-input">
                        <input type="text" id="chatbotInput" placeholder="Ask me anything about your retail business..." maxlength="500">
                        <button id="sendMessage" disabled>
                            <i class="bi bi-send"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modalStyles = `
            .ai-chatbot-modal {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 380px;
                height: 600px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                z-index: 1001;
                display: none;
                flex-direction: column;
                overflow: hidden;
                animation: slideUp 0.3s ease;
            }
            
            .ai-chatbot-modal.show {
                display: flex;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .chatbot-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .chatbot-header {
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chatbot-header-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .chatbot-avatar {
                width: 40px;
                height: 40px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            
            .chatbot-title h6 {
                margin: 0;
                font-weight: 600;
            }
            
            .chatbot-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background 0.2s;
            }
            
            .chatbot-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .chatbot-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #f8f9fa;
            }
            
            .message {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                flex-shrink: 0;
            }
            
            .bot-message .message-avatar {
                background: #007bff;
                color: white;
            }
            
            .user-message {
                flex-direction: row-reverse;
            }
            
            .user-message .message-avatar {
                background: #28a745;
                color: white;
            }
            
            .message-content {
                background: white;
                padding: 12px 16px;
                border-radius: 16px;
                max-width: 280px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .user-message .message-content {
                background: #007bff;
                color: white;
            }
            
            .message-content p {
                margin: 0 0 8px 0;
            }
            
            .message-content p:last-child {
                margin-bottom: 0;
            }
            
            .message-content ul {
                margin: 8px 0;
                padding-left: 20px;
            }
            
            .message-content li {
                margin-bottom: 4px;
            }
            
            .chatbot-input-area {
                border-top: 1px solid #e9ecef;
                background: white;
            }
            
            .chatbot-suggestions {
                padding: 12px 16px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .suggestion-btn {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 20px;
                padding: 6px 12px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .suggestion-btn:hover {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
            
            .chatbot-input {
                display: flex;
                padding: 16px;
                gap: 12px;
                align-items: center;
            }
            
            .chatbot-input input {
                flex: 1;
                border: 1px solid #dee2e6;
                border-radius: 24px;
                padding: 12px 16px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }
            
            .chatbot-input input:focus {
                border-color: #007bff;
            }
            
            .chatbot-input button {
                width: 40px;
                height: 40px;
                border: none;
                background: #007bff;
                color: white;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .chatbot-input button:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }
            
            .chatbot-input button:not(:disabled):hover {
                background: #0056b3;
                transform: scale(1.05);
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
            }
            
            .typing-dot {
                width: 8px;
                height: 8px;
                background: #6c757d;
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            
            @media (max-width: 768px) {
                .ai-chatbot-modal {
                    bottom: 80px;
                    right: 15px;
                    left: 15px;
                    width: auto;
                    height: 500px;
                }
                
                .message-content {
                    max-width: 220px;
                }
            }
        `;
        
        const modalStyleSheet = document.createElement('style');
        modalStyleSheet.textContent = modalStyles;
        document.head.appendChild(modalStyleSheet);
        document.body.appendChild(chatModal);
    }

    setupEventListeners() {
        const chatButton = document.getElementById('ai-chatbot-button');
        const chatModal = document.getElementById('ai-chatbot-modal');
        const closeButton = document.getElementById('closeChatbot');
        const input = document.getElementById('chatbotInput');
        const sendButton = document.getElementById('sendMessage');
        const suggestions = document.querySelectorAll('.suggestion-btn');

        chatButton.addEventListener('click', () => this.toggleChat());
        closeButton.addEventListener('click', () => this.closeChat());
        
        input.addEventListener('input', (e) => {
            sendButton.disabled = !e.target.value.trim();
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !sendButton.disabled) {
                this.sendMessage();
            }
        });
        
        sendButton.addEventListener('click', () => this.sendMessage());
        
        suggestions.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message;
                input.value = message;
                sendButton.disabled = false;
                this.sendMessage();
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !chatModal.contains(e.target) && !chatButton.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        const modal = document.getElementById('ai-chatbot-modal');
        modal.classList.add('show');
        this.isOpen = true;
        
        // Focus input
        setTimeout(() => {
            document.getElementById('chatbotInput').focus();
        }, 300);
    }

    closeChat() {
        const modal = document.getElementById('ai-chatbot-modal');
        modal.classList.remove('show');
        this.isOpen = false;
    }

    async sendMessage() {
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        document.getElementById('sendMessage').disabled = true;
        
        // Hide suggestions after first message
        const suggestions = document.getElementById('chatbotSuggestions');
        if (this.messages.length === 0) {
            suggestions.style.display = 'none';
        }
        
        this.messages.push({ role: 'user', content: message });
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            this.hideTypingIndicator();
            
            if (data.error) {
                this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            } else {
                this.addMessage(data.response, 'bot');
                this.messages.push({ role: 'assistant', content: data.response });
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTypingIndicator();
            this.addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
        }
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'bot' ? '<i class="bi bi-robot"></i>' : '<i class="bi bi-person"></i>';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${this.formatMessage(content)}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar"><i class="bi bi-robot"></i></div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.isTyping = true;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiChatbot = new AIChatbot();
});
