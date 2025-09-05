import { NextRequest, NextResponse } from 'next/server';
import { TransferService } from '@/lib/db-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistItemId, wishlistItemIds } = body;

    // Validate input
    if (!wishlistItemId && !wishlistItemIds) {
      return NextResponse.json(
        { success: false, error: 'Either wishlistItemId or wishlistItemIds is required' },
        { status: 400 }
      );
    }

    if (wishlistItemId && wishlistItemIds) {
      return NextResponse.json(
        { success: false, error: 'Provide either wishlistItemId for single transfer or wishlistItemIds for batch transfer, not both' },
        { status: 400 }
      );
    }

    let result;

    if (wishlistItemId) {
      // Single item transfer
      if (typeof wishlistItemId !== 'number') {
        return NextResponse.json(
          { success: false, error: 'wishlistItemId must be a number' },
          { status: 400 }
        );
      }

      console.log(`Transferring single wishlist item ${wishlistItemId} to collection`);
      result = TransferService.moveWishlistItemToCollection(wishlistItemId);
      
    } else {
      // Batch transfer
      if (!Array.isArray(wishlistItemIds) || wishlistItemIds.some(id => typeof id !== 'number')) {
        return NextResponse.json(
          { success: false, error: 'wishlistItemIds must be an array of numbers' },
          { status: 400 }
        );
      }

      console.log(`Transferring ${wishlistItemIds.length} wishlist items to collection:`, wishlistItemIds);
      result = TransferService.batchMoveWishlistItemsToCollection(wishlistItemIds);
    }

    if (result.success) {
      console.log('Transfer completed successfully:', result);
      return NextResponse.json(result);
    } else {
      console.error('Transfer failed:', result);
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    console.error('Error in transfer API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}