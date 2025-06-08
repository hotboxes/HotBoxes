import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, cashAppUsername, userEmail, username, userId, userBalance } = await request.json();
    
    // In a production app, you'd use a service like SendGrid, Resend, or AWS SES
    // For now, we'll just log it (you can check Vercel logs)
    console.log('WITHDRAWAL REQUEST:', {
      amount,
      cashAppUsername,
      userEmail,
      username,
      userId,
      userBalance,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Replace with actual email service
    // Example with a service like Resend:
    /*
    await resend.emails.send({
      from: 'noreply@playhotboxes.com',
      to: 'jakelefkow@gmail.com',
      subject: `Withdrawal Request - $${amount} to ${cashAppUsername}`,
      html: `
        <h2>New Withdrawal Request</h2>
        <p>A user has requested a withdrawal:</p>
        <ul>
          <li><strong>Amount:</strong> $${amount}</li>
          <li><strong>User CashApp:</strong> ${cashAppUsername}</li>
          <li><strong>User Email:</strong> ${userEmail}</li>
          <li><strong>HotBoxes Username:</strong> ${username}</li>
          <li><strong>User ID:</strong> ${userId}</li>
          <li><strong>Remaining Balance:</strong> $${userBalance}</li>
        </ul>
        <p><strong>Action Required:</strong> Send $${amount} to ${cashAppUsername} via CashApp</p>
        <p>Once sent, mark as completed in the admin panel.</p>
        <a href="https://playhotboxes.com/admin/withdrawals">Manage Withdrawals</a>
      `
    });
    */
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending withdrawal notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}