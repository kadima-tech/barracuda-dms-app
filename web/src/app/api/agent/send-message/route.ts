import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { message, sessionId, agentName, userId } = await request.json();

  try {
    const response = await fetch(`http://localhost:8000/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_name: agentName,
        user_id: userId,
        session_id: sessionId,
        new_message: {
          role: 'user',
          parts: [{ text: message }],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error }, { status: response.status });
    }

    const events = await response.json();
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error sending message to agent:', error);
    return NextResponse.json(
      { error: 'Failed to send message to agent' },
      { status: 500 }
    );
  }
}
