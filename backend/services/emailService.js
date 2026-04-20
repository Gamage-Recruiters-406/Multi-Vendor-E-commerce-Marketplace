// services/emailService.js
import nodemailer from 'nodemailer';

let transporter = null;

// Initialize email transporter
const initTransporter = () => {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    const transport = initTransporter();
    if (!transport) {
      console.log('Email service not configured');
      return { success: false, error: 'Email not configured' };
    }

    const info = await transport.sendMail({
      from: `"${process.env.APP_NAME || 'Gamage Recruiters'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Professional email wrapper/layout
const getEmailLayout = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      color: rgba(255,255,255,0.9);
      margin: 10px 0 0;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
      color: #333333;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      border-top: 1px solid #e0e0e0;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      margin: 0 10px;
      text-decoration: none;
      color: #667eea;
    }
    .order-details {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-delivered { background: #d4edda; color: #155724; }
    .status-shipped { background: #d1ecf1; color: #0c5460; }
    .status-confirmed { background: #fff3cd; color: #856404; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    @media (max-width: 480px) {
      .content { padding: 20px; }
      .button { display: block; text-align: center; }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
  <div class="container">
    <div class="header">
      <h1>${process.env.APP_NAME || 'Gamage Recruiters'}</h1>
      <p>Your Trusted Shopping Partner</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="#">Facebook</a> | 
        <a href="#">Twitter</a> | 
        <a href="#">Instagram</a>
      </div>
      <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Gamage Recruiters'}. All rights reserved.</p>
      <p>Need help? Contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@gamagerecruiters.com'}">${process.env.SUPPORT_EMAIL || 'support@gamagerecruiters.com'}</a></p>
      <p style="font-size: 11px;">This is a transactional email. You will receive these emails as part of your order process.</p>
    </div>
  </div>
</body>
</html>
`;

// Get status badge color
const getStatusBadgeClass = (type) => {
  if (type.includes('delivered')) return 'status-delivered';
  if (type.includes('shipped')) return 'status-shipped';
  if (type.includes('confirmed')) return 'status-confirmed';
  if (type.includes('cancelled')) return 'status-cancelled';
  return '';
};

// Professional email templates
const getEmailTemplate = (type, data) => {
  const templates = {
    order_placed: {
      subject: `🎉 Order Confirmed #${data.orderNumber} - Thank You for Your Purchase!`,
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.customerName},</h2>
        <p style="font-size: 16px;">Thank you for shopping with us! Your order has been successfully placed and is now being processed.</p>
        
        <div class="order-details">
          <h3 style="margin-top: 0;">📋 Order Summary</h3>
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #667eea;">$${data.totalAmount}</span></p>
          <p><strong>Payment Status:</strong> ${data.paymentStatus || 'Pending'}</p>
        </div>
        
        <p>We'll notify you once your order is confirmed by the vendor. You can track your order status in real-time.</p>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}" class="button">View Order Details</a>
        </div>
        
        <p style="margin-top: 20px; font-size: 14px; color: #666;">Estimated processing time: 1-2 business days.</p>
      `
    },
    
    order_confirmed: {
      subject: `✅ Order Confirmed #${data.orderNumber} - Ready for Processing`,
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Dear ${data.customerName},</h2>
        <p style="font-size: 16px;">Great news! Your order has been <strong>confirmed</strong> by the vendor.</p>
        
        <div class="order-details">
          <h3 style="margin-top: 0;">📦 Order Status Update</h3>
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><span class="status-badge ${getStatusBadgeClass('confirmed')}">✓ CONFIRMED</span></p>
          <p>Your items are now being prepared for shipment.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}" class="button">Track Order</a>
        </div>
        
        <p style="margin-top: 20px;">You'll receive another notification once your order is shipped.</p>
      `
    },
    
    order_shipped: {
      subject: `🚚 Order Shipped #${data.orderNumber} - Your Package is On The Way!`,
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.customerName},</h2>
        <p style="font-size: 16px;">Your order is on its way! We're excited for you to receive your items.</p>
        
        <div class="order-details">
          <h3 style="margin-top: 0;">🚚 Shipping Information</h3>
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><span class="status-badge ${getStatusBadgeClass('shipped')}">📦 SHIPPED</span></p>
          ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
          ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
          ${data.carrier ? `<p><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}/tracking" class="button">Track Your Package</a>
        </div>
        
        <p style="margin-top: 20px;">You can track your package in real-time using the link above.</p>
      `
    },
    
    order_delivered: {
      subject: `🎁 Order Delivered #${data.orderNumber} - We Hope You Love Your Purchase!`,
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Dear ${data.customerName},</h2>
        <p style="font-size: 16px;">Your order has been successfully <strong>delivered</strong>! We hope you're enjoying your purchase.</p>
        
        <div class="order-details">
          <h3 style="margin-top: 0;">✅ Delivery Confirmation</h3>
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><span class="status-badge status-delivered">✓ DELIVERED</span></p>
          <p><strong>Delivered On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}/review" class="button">Leave a Review</a>
          <a href="${process.env.FRONTEND_URL}/orders/${data.orderId}" style="margin-left: 10px;" class="button">View Order</a>
        </div>
        
        <p style="margin-top: 20px;">Loved your purchase? Leave a review and help other customers make informed decisions!</p>
      `
    },
    
    order_cancelled: {
      subject: `⚠️ Order Cancelled #${data.orderNumber} - Update on Your Order`,
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Hello ${data.customerName},</h2>
        <p style="font-size: 16px;">We regret to inform you that your order has been <strong>cancelled</strong>.</p>
        
        <div class="order-details">
          <h3 style="margin-top: 0;">❌ Cancellation Details</h3>
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><span class="status-badge status-cancelled">✗ CANCELLED</span></p>
          ${data.reason ? `<p><strong>Cancellation Reason:</strong> ${data.reason}</p>` : ''}
          ${data.refundAmount ? `<p><strong>Refund Amount:</strong> $${data.refundAmount}</p>` : ''}
        </div>
        
        <p>If you have any questions about this cancellation, please don't hesitate to contact our support team.</p>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/contact" class="button">Contact Support</a>
          <a href="${process.env.FRONTEND_URL}/shop" style="margin-left: 10px;" class="button">Continue Shopping</a>
        </div>
      `
    },
    
    announcement: {
      subject: `📢 ${data.title}`,
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Dear ${data.customerName},</h2>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2px; border-radius: 8px;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="color: #667eea; margin-top: 0;">${data.title}</h3>
            <p style="font-size: 16px; line-height: 1.6;">${data.message}</p>
          </div>
        </div>
        ${data.ctaLink ? `
        <div style="text-align: center; margin-top: 20px;">
          <a href="${data.ctaLink}" class="button">Learn More</a>
        </div>
        ` : ''}
      `
    },
    
    promotion: {
      subject: `🎉 ${data.title} - Special Offer Just For You!`,
      content: `
        <h2 style="color: #333; margin-bottom: 20px;">Dear ${data.customerName},</h2>
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; border-radius: 8px; text-align: center; color: white;">
          <h2 style="margin: 0; color: white;">${data.title}</h2>
          <p style="font-size: 18px; margin: 10px 0;">${data.message}</p>
          ${data.offerCode ? `
          <div style="background: white; display: inline-block; padding: 10px 20px; border-radius: 5px; margin: 15px 0;">
            <code style="font-size: 20px; font-weight: bold; color: #ee5a24;">${data.offerCode}</code>
          </div>
          <p style="margin: 0;">Use this code at checkout</p>
          ` : ''}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL}/shop" class="button">Shop Now</a>
        </div>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">*Terms and conditions apply. Offer valid for a limited time only.</p>
      `
    }
  };

  const selectedTemplate = templates[type] || templates.announcement;
  const emailContent = getEmailLayout(selectedTemplate.content, selectedTemplate.subject);
  
  return {
    subject: selectedTemplate.subject,
    html: emailContent
  };
};

export default { sendEmail, getEmailTemplate };