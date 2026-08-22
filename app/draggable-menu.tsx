'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

type MenuItem = {
  title: string
  tagline: string
  desc: string
  href: string
  color: string
}

const DEFAULT_MENUS: MenuItem[] = [
  {
    title: 'FIELD SURVEY',
    tagline: 'Capture. Analyze. Execute.',
    desc: 'Field data & site survey management.',
    href: '/site-survey',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    title: 'WORKFORCE',
    tagline: 'Track. Optimize. Perform.',
    desc: 'Manpower, timesheet & productivity management.',
    href: '/timesheet',
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    title: 'VALVE SERVICE REPORT',
    tagline: 'Inspect. Repair. Verify.',
    desc: 'Complete valve service documentation from initial inspection through repair and final verification.',
    href: '/reports',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    title: 'PROJECT COST',
    tagline: 'Plan. Control. Optimize.',
    desc: 'Project budgeting & cost management.',
    href: '/budgeting',
    color: 'bg-orange-600 hover:bg-orange-700',
  },
  {
    title: 'PROJECT CONTROL',
    tagline: 'Plan. Monitor. Deliver.',
    desc: 'Project progress, performance & execution control.',
    href: '/project-control',
    color: 'bg-red-600 hover:bg-red-700',
  },
  {
    title: 'ENGINEERING HUB',
    tagline: 'Calculate. Verify. Engineer.',
    desc: 'Engineering calculations, technical verification & design tools.',
    href: '/engineering-hub',
    color: 'bg-teal-600 hover:bg-teal-700',
  },
  {
    title: 'AI ASSISTANT',
    tagline: 'Think. Analyze. Solve.',
    desc: 'AI-powered insights, smart analysis & decision support.',
    href: '/ai',
    color: 'bg-indigo-600 hover:bg-indigo-700',
  },
]

const STORAGE_KEY = 'menu_order'

function loadOrder(): MenuItem[] {
  if (typeof window === 'undefined') return DEFAULT_MENUS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MENUS
    const saved = JSON.parse(raw) as MenuItem[]
    const hrefs = DEFAULT_MENUS.map((m) => m.href)
    const valid = saved.every((m) => hrefs.includes(m.href))
    if (valid && saved.length === DEFAULT_MENUS.length) return saved
  } catch {}
  return DEFAULT_MENUS
}

export default function DraggableMenuGrid() {
  const [menus, setMenus] = useState<MenuItem[]>(DEFAULT_MENUS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMenus(loadOrder())
    setMounted(true)
  }, [])

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const from = result.source.index
    const to = result.destination.index
    if (from === to) return
    const next = [...menus]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setMenus(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="menu-grid" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
          >
            {menus.map((m, i) => (
              <Draggable key={m.href} draggableId={m.href} index={i}>
                {(prov, snap) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    style={prov.draggableProps.style}
                  >
                    <div
                      {...prov.dragHandleProps}
                      className={`${m.color} text-white rounded-xl p-5 shadow-lg transition ${
                        snap.isDragging ? 'scale-105 shadow-2xl z-50 rotate-1' : 'hover:scale-105'
                      } flex flex-col h-[170px] cursor-grab active:cursor-grabbing relative overflow-hidden`}
                    >
                      <div className="absolute top-2 right-3 opacity-30 text-lg select-none">⣿</div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-sm font-bold tracking-wide leading-tight">{m.title}</h2>
                      </div>
                      <p className="text-[10px] text-white/60 italic">{m.tagline}</p>
                      <div className="flex-1" />
                      <p className="text-xs text-white/80 leading-relaxed">{m.desc}</p>
                      <Link href={m.href} className="absolute inset-0 z-10" tabIndex={-1} />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
