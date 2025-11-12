import { NextRequest, NextResponse } from 'next/server';
import { completeNewPasswordChallenge } from '@/lib/cognito';

export async function POST(request: NextRequest) {
  try {
    const { newPassword, userAttributes } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    try {
      const result = await completeNewPasswordChallenge(
        newPassword,
        userAttributes
      );
      return NextResponse.json({ success: true, result });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Password change failed',
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

