import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { amount, cashAppUsername, userEmail, username, userId, userBalance } = await request.json();
    
    // Log for backup
    console.log('WITHDRAWAL REQUEST:', {
      amount,
      cashAppUsername,
      userEmail,
      username,
      userId,
      userBalance,
      timestamp: new Date().toISOString()
    });
    
    // Send email notification
    try {
      await resend.emails.send({
        from: 'HotBoxes <noreply@playhotboxes.com>',
        to: 'jakelefkow@gmail.com',
        subject: `💸 Withdrawal Request - $${amount} to ${cashAppUsername}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🔥 New Withdrawal Request</h2>
            <p>A user has requested a withdrawal from HotBoxes:</p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #dc2626;">Withdrawal Details</h3>
              <ul style="line-height: 1.6;">
                <li><strong>Amount:</strong> $${amount}</li>
                <li><strong>Send to CashApp:</strong> <code style="background: #fecaca; padding: 2px 6px; border-radius: 4px;">${cashAppUsername}</code></li>
                <li><strong>User Email:</strong> ${userEmail}</li>
                <li><strong>HotBoxes Username:</strong> ${username}</li>
                <li><strong>Remaining Balance:</strong> $${userBalance}</li>
                <li><strong>User ID:</strong> <code style="background: #fecaca; padding: 2px 6px; border-radius: 4px;">${userId}</code></li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #d97706;">⚡ Action Required</h3>
              <p><strong>1.</strong> Open CashApp on your phone</p>
              <p><strong>2.</strong> Send $${amount} to <strong>${cashAppUsername}</strong></p>
              <p><strong>3.</strong> Mark as completed in admin panel</p>
            </div>
            
            <p style="text-align: center;">
              <a href="https://playhotboxes.com/admin/payments" 
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Manage Withdrawals
              </a>
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              HotBoxes - Withdrawal Request<br>
              ${new Date().toLocaleString()}
            </p>
          </div>
        `
      });
      
      console.log('Withdrawal email sent successfully');
    } catch (emailError) {
      console.error('Failed to send email, but continuing:', emailError);
      // Don't fail the whole request if email fails
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing withdrawal notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}