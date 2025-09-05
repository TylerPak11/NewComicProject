import { NextRequest, NextResponse } from 'next/server';
import { PublisherService } from '@/lib/db-service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    const publishers = PublisherService.getAll();
    
    // Filter by search query if provided
    const filteredPublishers = query 
      ? publishers.filter(publisher => 
          publisher.name.toLowerCase().includes(query.toLowerCase())
        )
      : publishers;
    
    // Transform for API response
    const transformedPublishers = filteredPublishers.map(p => ({
      id: p.id,
      name: p.name
    }));
    
    return NextResponse.json(transformedPublishers);
  } catch (error) {
    console.error('Error fetching publishers:', error);
    return NextResponse.json({ error: 'Failed to fetch publishers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Publisher name is required' }, { status: 400 });
    }
    
    const newPublisher = PublisherService.create(name.trim());
    return NextResponse.json({
      id: newPublisher.id,
      name: newPublisher.name
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating publisher:', error);
    return NextResponse.json({ error: 'Failed to create publisher' }, { status: 500 });
  }
}