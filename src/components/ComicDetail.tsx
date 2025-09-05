'use client';

import { ComicIssue, ComicWithIssues } from '@/types/comic';

interface ComicDetailProps {
  issue: ComicIssue;
  series: ComicWithIssues;
  onBack: () => void;
}

export default function ComicDetail({ issue, series, onBack }: ComicDetailProps) {
  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm"
          >
            ← Back to {series.title}
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-blue-600">
              {series.title}: {issue.title || `Issue #${issue.issueNumber}`}
            </h1>
            <p className="text-sm text-gray-600">
              Secret Wars: Warzones - In Which All the World's a Stage and The Guardians Overthrow the Players
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
              #{issue.issueNumber}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex gap-6 p-6">
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="aspect-[2/3] bg-gray-200 rounded mb-4">
                {issue.coverUrl ? (
                  <img 
                    src={issue.coverUrl} 
                    alt={`${series.title} #${issue.issueNumber}`}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white text-4xl font-bold">
                    #{issue.issueNumber}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">In Collection</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500">
                      <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Release:</div>
                  <div className="text-sm text-gray-600">
                    {issue.releaseDate ? new Date(issue.releaseDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'Unknown'}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Cover:</div>
                  <div className="text-sm text-gray-600">
                    {issue.releaseDate ? new Date(issue.releaseDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    }) : 'Unknown'}
                  </div>
                </div>

                {issue.upc && (
                  <div>
                    <div className="text-sm font-medium mb-1">UPC:</div>
                    <div className="text-sm text-gray-600 font-mono">{issue.upc}</div>
                  </div>
                )}

                {issue.plot && (
                  <div>
                    <div className="text-sm font-medium mb-1">Plot:</div>
                    <div className="text-sm text-gray-600">{issue.plot}</div>
                  </div>
                )}

                {issue.variantDescription && (
                  <div>
                    <div className="text-sm font-medium mb-1">Variant:</div>
                    <div className="text-sm text-gray-600">{issue.variantDescription}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold mb-2">
                    MARVEL
                  </div>
                  <div className="text-xs text-gray-500">
                    {issue.upc && `UPC: ${issue.upc}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button className="text-blue-600 text-sm hover:underline">
                Find sold listings on eBay
              </button>
              <div className="text-xs text-gray-500 mt-1">
                We may be compensated for purchases made
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {issue.plot || 
                    "The hunt is on! The Faustians have made their deal with the Devil...er, Enchantress, but Angela isn't going to take that lying down, is she? No, not by her psychic ribbons and very, very pointy weapons, no, she is not. Out into the wilds of the countryside, Angela and Sera collide with a wandering caravan of ne'er-do-well performers. (Hint: their name starts with a 'G' and ends with an 'Y' and has 'uardians of the Galaxy' in the middle.) Pagan rites, dubious ethics, a deadly curse, and Kieron and Irene Koh being up to no good, who can resist the lure of the Faustians?"
                  }
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {issue.locgLink && (
                  <div className="flex">
                    <div className="w-24 text-sm font-medium text-gray-500">LOCG Link:</div>
                    <div className="text-sm">
                      <a href={issue.locgLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                        View on LOCG
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}