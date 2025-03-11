import { NextRequest, NextResponse } from 'next/server';
import { resetAdminUser } from '@/lib/auth-actions';

// This route is used to reset the admin user credentials
export async function POST(request: NextRequest) {
  try {
    const { email, password, secretKey } = await request.json();
    
    // Validate request
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Simple security check - require a secret key
    // In production, you should use a more secure approach
    const expectedSecretKey = process.env.ADMIN_RESET_KEY || 'ProjectPlanner_AdminReset_2024';
    
    if (secretKey !== expectedSecretKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Reset the admin user
    const result = await resetAdminUser(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Admin user reset successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin reset error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 