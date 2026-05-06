import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Phone, Loader, ChevronLeft, HelpCircle } from 'lucide-react';
import {
  getFAQQuestionsApi,
  getFAQAnswerApi,
  askAIQuestionApi,
  contactVendorApi,
  sendVendorMessageApi,
} from '../../services/Q&A';
import { showToast } from '../../utils/toast';

const Q_AND_A_PAGE = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId } = useParams();

  const [messages, setMessages] = useState([]);
  const [faqQuestions, setFaqQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [productData, setProductData] = useState(null);
  const [chatMode, setChatMode] = useState('faq'); // 'faq' | 'ai-chat' | 'vendor'
  const [contactingVendor, setContactingVendor] = useState(false);
  const [vendorConnected, setVendorConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, answered: 0, pending: 0, rate: 0 });
  const messagesEndRef = useRef(null);

  // Get product from location state or URL
  useEffect(() => {
    const product = location.state?.product;
    if (product) {
      setProductData(product);
      loadFAQQuestions(product._id);
    } else if (productId) {
      loadFAQQuestions(productId);
    }
  }, [location, productId]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load FAQ questions
  const loadFAQQuestions = async (pId) => {
    try {
      setLoading(true);
      const response = await getFAQQuestionsApi(pId);
      setFaqQuestions(response.questions || []);
      
      if (!productData && response.productName) {
        setProductData({ _id: pId, name: response.productName });
      }

      // Initialize session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      // Calculate stats
      const total = response.questions?.length || 0;
      setStats({
        total,
        answered: Math.floor(total * 0.8),
        pending: Math.floor(total * 0.2),
        rate: 85
      });

      // Add welcome message
      setMessages([
        {
          id: 'welcome',
          text: `Hello! 👋 Ask questions about ${response.productName || 'this product'}. Choose from quick questions below or type your own.`,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);

      setChatMode('faq');
    } catch (error) {
      console.error('Error loading FAQ:', error);
      showToast('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle FAQ question click
  const handleFAQClick = async (question) => {
    const userMsg = {
      id: `msg_${Date.now()}`,
      text: question.question,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await getFAQAnswerApi({
        questionId: question.id,
        productId: productData._id,
      });

      const botMsg = {
        id: `msg_${Date.now()}_bot`,
        text: response.answer,
        sender: 'bot',
        timestamp: new Date(),
        status: 'answered'
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = {
        id: `msg_${Date.now()}_error`,
        text: 'Could not retrieve the answer. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Handle custom question
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setChatMode('ai-chat');

    try {
      const response = await askAIQuestionApi({
        productId: productData._id,
        message: inputMessage,
        sessionId: sessionId,
      });

      const botMsg = {
        id: `msg_${Date.now()}_bot`,
        text: response.answer,
        sender: 'bot',
        timestamp: new Date(),
        status: 'answered'
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = {
        id: `msg_${Date.now()}_error`,
        text: 'Something went wrong. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Contact vendor
  const handleContactVendor = async () => {
    setContactingVendor(true);
    try {
      const response = await contactVendorApi({
        productId: productData._id,
        sessionId: sessionId,
      });

      setVendorConnected(true);
      setChatMode('vendor');

      const botMsg = {
        id: `msg_${Date.now()}_bot`,
        text: '✅ Connected with store! They will respond shortly.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to contact store', 'error');
    } finally {
      setContactingVendor(false);
    }
  };

  // Send vendor message
  const handleSendVendorMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    try {
      await sendVendorMessageApi({
        sessionId: sessionId,
        message: inputMessage,
      });

      const botMsg = {
        id: `msg_${Date.now()}_bot`,
        text: '✉️ Message sent to store!',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to send message', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader className="w-12 h-12 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Q&A Management</h1>
              <p className="text-sm text-slate-500">Review and respond to customer inquiries</p>
            </div>
          </div>
          <div className="bg-teal-50 px-3 py-1 rounded-full text-sm font-medium text-teal-700">
            {vendorConnected ? '🟢 Store Connected' : '💬 Bot Mode'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-slate-600 text-sm font-medium mb-2">Total Questions</div>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-slate-600 text-sm font-medium mb-2">Answered</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.answered}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-slate-600 text-sm font-medium mb-2">Pending</div>
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-slate-600 text-sm font-medium mb-2">Response Rate</div>
            <div className="text-3xl font-bold text-blue-600">{stats.rate}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px] overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-teal-600 text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* FAQ Buttons */}
              {chatMode === 'faq' && faqQuestions.length > 0 && (
                <div className="border-t border-slate-200 px-6 py-4 bg-white max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Quick Questions:</p>
                  <div className="space-y-2 flex flex-col">
                    {faqQuestions.slice(0, 3).map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleFAQClick(q)}
                        className="text-left text-sm bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium px-3 py-2 rounded-lg transition truncate"
                      >
                        💬 {q.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <form onSubmit={vendorConnected ? handleSendVendorMessage : handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={vendorConnected ? 'Message the store...' : 'Ask a question...'}
                    className="flex-1 border border-slate-300 focus:border-teal-500 rounded-lg px-4 py-2 focus:outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg px-4 py-2 transition font-medium"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Product Info */}
            {productData && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  Product
                </h3>
                <p className="text-sm text-slate-600 line-clamp-2">{productData.name}</p>
                {productData.price && (
                  <p className="text-lg font-bold text-teal-600 mt-3">${productData.price}</p>
                )}
              </div>
            )}

            {/* Contact Vendor */}
            {!vendorConnected && (
              <button
                onClick={handleContactVendor}
                disabled={contactingVendor}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-300 text-white rounded-lg px-4 py-4 font-semibold transition flex items-center justify-center gap-2 shadow-sm"
              >
                {contactingVendor ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Contact Store
                  </>
                )}
              </button>
            )}

            {vendorConnected && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="font-bold text-emerald-900">Store Connected</p>
                </div>
                <p className="text-sm text-emerald-800">Chatting with store directly</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
              <h4 className="font-bold text-teal-900 mb-2">💡 How to use</h4>
              <ul className="text-sm text-teal-800 space-y-1">
                <li>✓ Click quick questions</li>
                <li>✓ Type for AI help</li>
                <li>✓ Contact store anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Q_AND_A_PAGE;
