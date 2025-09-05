'use client';

import { ComicIssue } from '@/types/comic';

interface ComicModalProps {
  issue: ComicIssue;
  onClose: () => void;
}

export default function ComicModal({ issue, onClose }: ComicModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">Collection</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="text-sm text-gray-600">Marvel Comics • 2018</div>
            <h1 className="text-xl font-bold text-gray-900">Amazing Spider-Man #1</h1>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Left Panel - Comic Cover */}
          <div className="w-80 border-r border-gray-200 p-6">
            <div className="aspect-[2/3] bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-lg mb-4">
              {issue.coverUrl ? (
                <img 
                  src={issue.coverUrl} 
                  alt={`Issue #${issue.issueNumber}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-4 text-white rounded-lg">
                  <div className="text-lg font-bold leading-tight">
                    Amazing Spider-Man
                  </div>
                  <div className="text-sm">
                    Marvel Comics
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">SERIES</div>
                    <div className="text-gray-900">Amazing Spider-Man</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">ISSUE</div>
                    <div className="text-gray-900">#{issue.issueNumber}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">PUBLISHER</div>
                    <div className="text-gray-900">Marvel Comics</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">RELEASE DATE</div>
                    <div className="text-gray-900">
                      {issue.releaseDate ? new Date(issue.releaseDate).toLocaleDateString() : '4/3/2018'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="font-medium text-gray-700 mb-1">UPC</div>
                  <div className="text-gray-900 font-mono text-sm">
                    {issue.upc || '75960608936800111'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 text-xs text-blue-600 border border-blue-600 rounded px-3 py-2 hover:bg-blue-50">
                  Export CSV
                </button>
                <button className="flex-1 text-xs text-blue-600 border border-blue-600 rounded px-3 py-2 hover:bg-blue-50">
                  Print to PDF
                </button>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                ⭐ Add to Wish List
              </button>
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">DESCRIPTION</h3>
                <p className="text-gray-700 leading-relaxed">
                  {issue.plot || "Spider-Man swings into a brand-new adventure! Peter Parker has overcome many obstacles in his life, but nothing could prepare him for the challenges that lie ahead. With great power comes great responsibility, and Spider-Man is about to learn just how heavy that responsibility can be."}
                </p>
              </div>

              {(issue.upc || issue.releaseDate || issue.variantDescription || issue.locgLink) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">DETAILS</h3>
                  <div className="space-y-2 text-sm">
                    {issue.releaseDate && (
                      <div className="flex">
                        <span className="w-20 text-gray-500">Release:</span>
                        <span className="text-gray-900">{new Date(issue.releaseDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {issue.upc && (
                      <div className="flex">
                        <span className="w-20 text-gray-500">UPC:</span>
                        <span className="text-gray-900 font-mono">{issue.upc}</span>
                      </div>
                    )}
                    {issue.variantDescription && (
                      <div className="flex">
                        <span className="w-20 text-gray-500">Variant:</span>
                        <span className="text-gray-900">{issue.variantDescription}</span>
                      </div>
                    )}
                    {issue.locgLink && (
                      <div className="flex">
                        <span className="w-20 text-gray-500">LOCG:</span>
                        <a href={issue.locgLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          View Details
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}