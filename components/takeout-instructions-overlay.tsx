"use client"

import React from 'react'
import { X, ExternalLink, Download } from "lucide-react"
import { Button } from "./ui/button"

export function TakeoutInstructionsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-10 overflow-hidden">
      {/* Overlay container */}
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: "600px" }}>
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-zinc-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">How to Get Your YouTube Watch History</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-2 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
          {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6 text-gray-800 dark:text-gray-200">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Step 1: Go to Google Takeout</h3>
              <p className="mb-2">
                Visit <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Takeout</a> to access your data.
              </p>
            </div>
              <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Step 2: Select YouTube Data Only</h3>
              <p className="mb-2">
                1. Click the <strong>"Deselect all"</strong> button at the top of the page<br />
                2. Scroll down and select only <strong>"YouTube and YouTube Music"</strong>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Step 3: Configure YouTube Options</h3>
              <p className="mb-2">
                1. Click <strong>"All YouTube data included"</strong> button<br />
                2. Click <strong>"Deselect all"</strong> in the popup<br />
                3. Select only <strong>"history"</strong><br />
                4. Make sure <strong>JSON</strong> is selected as the format<br />
                5. Click <strong>"OK"</strong>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Step 4: Create and Download</h3>
              <p className="mb-2">
                1. Click <strong>"Next step"</strong><br />
                2. Choose delivery method (<strong>export once</strong>)<br />
                3. Click <strong>"Create export"</strong><br />
                4. Wait for the export to be ready (you'll get an email)<br />
                5. Download the <strong>ZIP file</strong> and extract it<br />
                6. Find <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-bold">watch-history.json</code> in the YouTube folder
              </p>
              
              <div className="mt-4 p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                <h4 className="font-medium mb-2 text-gray-800 dark:text-white">File Information:</h4>
                <p className="mb-1"><strong>File type:</strong> .zip</p>
                <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Zip files can be opened on almost any computer</p>
                <p className="mb-1"><strong>File size:</strong> ~2 GB</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">The output of your request might be delivered in multiple files</p>
              </div>
            </div>
              <div className="pt-2">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Step 5: Upload the File</h3>
              <p className="mb-2">
                Return to this page and upload your <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-bold">watch-history.json</code> file to analyze your YouTube watch patterns.
              </p>
            </div>
          </div>
        </div>
          {/* Footer */}
        <div className="border-t border-gray-200 dark:border-zinc-700 p-4 flex justify-between items-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.open("https://takeout.google.com", "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open Google Takeout</span>
          </Button>
          
          <Button onClick={onClose}>Got it, thanks!</Button>
        </div>
      </div>
    </div>
  )
}
