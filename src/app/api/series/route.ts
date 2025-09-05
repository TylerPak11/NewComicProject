import { NextRequest, NextResponse } from 'next/server';
import { SeriesService } from '@/lib/db-service';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    const series = SeriesService.getAll();
    
    // Filter by search query if provided
    const filteredSeries = query 
      ? series.filter(s => 
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          (s.publisherName && s.publisherName.toLowerCase().includes(query.toLowerCase()))
        )
      : series;
    
    // Return all series table columns except created_at
    const transformedSeries = filteredSeries.map(s => ({
      id: s.id,
      name: s.name,
      publisherId: s.publisherId,
      publisherName: s.publisherName,
      totalIssues: s.totalIssues,
      locgLink: s.locgLink,
      startDate: s.startDate,
      endDate: s.endDate
    }));
    
    return NextResponse.json(transformedSeries);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newSeries = SeriesService.create(body);
    return NextResponse.json(newSeries, { status: 201 });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}