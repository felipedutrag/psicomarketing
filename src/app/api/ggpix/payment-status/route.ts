import { NextResponse } from 'next/server';

const GGPIX_API_KEY = process.env.GGPIX_API_KEY;
const GGPIX_API_URL = 'https://ggpixapi.com/api/v1';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId || orderId === 'undefined') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log(`Checking status for Order ID (GGPIX): ${orderId}`);

    // Try to get status from GGPIX
    // Using GET /transactions/{id} as per documentation
    const response = await fetch(`${GGPIX_API_URL}/transactions/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': GGPIX_API_KEY || '',
      },
    });

    const data = await response.json();
    console.log("GGPIX Status Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
        console.error("GGPIX Status Check Error:", data);
        // If 404, maybe it doesn't exist yet or wrong endpoint, return pending
        return NextResponse.json({ status: 'pending', raw: data });
    }

    // Map GGPIX status to our internal status
    // Expected statuses: PENDING, COMPLETE, FAILED, CANCELED
    const ggpixStatus = data.status; 
    
    let internalStatus = 'pending';
    let isPaid = false;

    if (ggpixStatus === 'PAID' || ggpixStatus === 'paid' || ggpixStatus === 'COMPLETED' || ggpixStatus === 'COMPLETE') {
        internalStatus = 'approved';
        isPaid = true;
    } else if (ggpixStatus === 'EXPIRED' || ggpixStatus === 'CANCELED' || ggpixStatus === 'FAILED') {
        internalStatus = 'cancelled';
    }

    return NextResponse.json({ 
      success: true, 
      status: internalStatus,
      is_paid: isPaid,
      data: data 
    });

  } catch (error) {
    console.error('GGPIX Status Check Error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
