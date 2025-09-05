import { NextRequest, NextResponse } from 'next/server';
import { IssueService } from '@/lib/db-service';

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const issueId = parseInt(id);
    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    // Get the existing issue to preserve fields not being updated
    const existingIssue = IssueService.getById(issueId);
    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Update the issue with the new data
    const updatedIssue = IssueService.update(issueId, {
      name: body.name || existingIssue.name,
      seriesId: typeof body.seriesId === 'number' ? body.seriesId : existingIssue.seriesId,
      publisherId: typeof body.publisherId === 'number' ? body.publisherId : existingIssue.publisherId,
      issueNo: typeof body.issueNo === 'number' ? body.issueNo : existingIssue.issueNo,
      variantDescription: body.variantDescription !== undefined ? body.variantDescription : existingIssue.variantDescription,
      coverUrl: body.coverUrl !== undefined ? body.coverUrl : existingIssue.coverUrl,
      releaseDate: body.releaseDate !== undefined ? body.releaseDate : existingIssue.releaseDate,
      upc: body.upc !== undefined ? body.upc : existingIssue.upc,
      locgLink: body.locgLink !== undefined ? body.locgLink : existingIssue.locgLink,
      plot: body.plot !== undefined ? body.plot : existingIssue.plot,
    });

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issueId = parseInt(id);
    
    if (isNaN(issueId)) {
      return NextResponse.json({ error: 'Invalid issue ID' }, { status: 400 });
    }

    // Check if the issue exists
    const existingIssue = IssueService.getById(issueId);
    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Delete the issue
    const deleted = IssueService.delete(issueId);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete issue' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json(
      { error: 'Failed to delete issue' }, 
      { status: 500 }
    );
  }
}