import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/cognito';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    try {
      const result = await signIn(email, password);
      return NextResponse.json({ success: true, result });
    } catch (error: any) {
      // Return the error details so the client can check for specific error types
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Authentication failed',
          code: error.code || error.name,
          name: error.name,
        },
        { status: 200 } // Return 200 so client can check the error type
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

