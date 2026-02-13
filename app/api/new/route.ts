// app/api/new/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming JSON body
    const body = await request.json();
    const { name, price, description } = body;

    // 2. Validate or perform logic (e.g., save to a database)
    if (!name || !price) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Example logic: Save to DB here...
    const newProduct = { id: Date.now(), name, price, description };

    // 3. Return a success response
    return NextResponse.json({ message: 'Product created!', product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
