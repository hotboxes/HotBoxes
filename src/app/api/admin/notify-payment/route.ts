import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { amount, transactionId, userEmail, userId, paymentRef } = await request.json();
    
    // Log for backup
    console.log('PAYMENT VERIFICATION NEEDED:', {
      amount,
      transactionId,
      userEmail,
      userId,
      paymentRef,
      timestamp: new Date().toISOString()
    });
    
    // Send email notification if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
        from: 'HotBoxes <noreply@playhotboxes.com>',
        to: 'jakelefkow@gmail.com',
        subject: `💰 Payment Verification Required - $${amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">💰 Payment Verification Needed</h2>
            <p>A user has submitted a payment over $100 that requires manual verification:</p>
            
            <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #059669;">Payment Details</h3>
              <ul style="line-height: 1.6;">
                <li><strong>Amount:</strong> $${amount}</li>
                <li><strong>Transaction ID:</strong> <code style="background: #a7f3d0; padding: 2px 6px; border-radius: 4px;">${transactionId}</code></li>
                <li><strong>Payment Reference:</strong> <code style="background: #a7f3d0; padding: 2px 6px; border-radius: 4px;">${paymentRef || 'N/A'}</code></li>
                <li><strong>User Email:</strong> ${userEmail}</li>
                <li><strong>User ID:</strong> <code style="background: #a7f3d0; padding: 2px 6px; border-radius: 4px;">${userId}</code></li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #d97706;">⚡ Action Required</h3>
              <p><strong>1.</strong> Check your CashApp history for transaction <strong>${transactionId}</strong></p>
              <p><strong>2.</strong> Verify the payment amount matches <strong>$${amount}</strong> to <strong>$playhotboxes</strong></p>
              <p><strong>3.</strong> Approve or reject in the admin panel</p>
            </div>
            
            <p style="text-align: center;">
              <a href="https://playhotboxes.com/admin/payments" 
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Verify Payment
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              HotBoxes - Payment Verification<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        `
      });
      
        console.log('Payment verification email sent successfully');
      } catch (emailError) {
        console.error('Failed to send email, but continuing:', emailError);
        // Don't fail the whole request if email fails
      }
    } else {
      console.log('Email not sent - Resend API key not configured');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}