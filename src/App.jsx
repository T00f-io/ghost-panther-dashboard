import { useState } from 'react'
import FitnessModule from './FitnessModule'

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">Ghost Panther Protocol</h1>
          <p className="text-xs text-zinc-500 tracking-widest uppercase">Personal Fitness OS</p>
        </div>
        <span className="text-xs text-zinc-600">T00f-io</span>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <FitnessModule />
        </div>
      </main>

    </div>
  )
}