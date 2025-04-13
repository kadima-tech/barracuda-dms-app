import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { agentName, userId } = await request.json();
  const sessionId = `s_${Date.now()}`;

  try {
    const response = await fetch(
      `http://localhost:8000/apps/${agentName}/users/${userId}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: {} }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ sessionId, data });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
