import { NextRequest, NextResponse } from 'next/server';
import { WishlistService } from '@/lib/db-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const itemId = parseInt(id);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Get the existing wishlist item to preserve fields not being updated
    const existingItems = WishlistService.getAll();
    const existingItem = existingItems.find(item => item.id === itemId);
    
    if (!existingItem) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
    }

    // For wishlist items, we need to update the item directly in the database
    // Since WishlistService doesn't have an update method, we'll need to delete and recreate
    // But this is not ideal. Let's create a simple update by modifying the database directly
    
    // This is a temporary solution - ideally we should add an update method to WishlistService
    const db = require('@/lib/database').default;
    
    const updateQuery = `
      UPDATE wishlist 
      SET name = ?, variant_description = ?, cover_url = ?, release_date = ?, upc = ?, locg_link = ?, plot = ?
      WHERE id = ?
    `;
    
    const stmt = db.prepare(updateQuery);
    stmt.run(
      body.name || existingItem.name,
      body.variantDescription !== undefined ? body.variantDescription : existingItem.variantDescription,
      body.coverUrl !== undefined ? body.coverUrl : existingItem.coverUrl,
      body.releaseDate !== undefined ? body.releaseDate : existingItem.releaseDate,
      body.upc !== undefined ? body.upc : existingItem.upc,
      body.locgLink !== undefined ? body.locgLink : existingItem.locgLink,
      body.plot !== undefined ? body.plot : existingItem.plot,
      itemId
    );

    // Get the updated item
    const updatedItems = WishlistService.getAll();
    const updatedItem = updatedItems.find(item => item.id === itemId);

    if (!updatedItem) {
      return NextResponse.json({ error: 'Failed to retrieve updated item' }, { status: 500 });
    }

    // Transform to match the comic format for the UI
    const transformedItem = {
      id: updatedItem.id.toString(),
      series: updatedItem.seriesName || 'Unknown Series',
      issue: updatedItem.issueNo,
      publisher: updatedItem.publisherName || 'Unknown Publisher',
      year: new Date(updatedItem.releaseDate || updatedItem.createdAt).getFullYear(),
      coverUrl: updatedItem.coverUrl,
      variantDescription: updatedItem.variantDescription,
      releaseDate: updatedItem.releaseDate,
      upc: updatedItem.upc,
      locgLink: updatedItem.locgLink,
      plot: updatedItem.plot,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist item' }, 
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
    const itemId = parseInt(id);
    
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    // Check if the wishlist item exists
    const existingItems = WishlistService.getAll();
    const existingItem = existingItems.find(item => item.id === itemId);
    
    if (!existingItem) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
    }

    // Delete the wishlist item
    const deleted = WishlistService.delete(itemId);
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete wishlist item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Wishlist item deleted successfully' });
  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    return NextResponse.json(
      { error: 'Failed to delete wishlist item' }, 
      { status: 500 }
    );
  }
}