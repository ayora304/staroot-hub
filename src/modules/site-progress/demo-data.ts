export interface ProgressItem {
  id: string
  title: string
  progress: number
  previous: number
  floor?: number
  previousFloor?: number
  note: string
}

export interface ProgressSection {
  id: string
  title: string
  items: ProgressItem[]
}

export interface ProgressPreviewProject {
  id: string
  name: string
  stage: string
  floors: number
  lookAhead: string
  sections: ProgressSection[]
}

export const previewProjects: ProgressPreviewProject[] = [
  {
    id: 'demo-gemini-1', name: 'Gemini Phase 1', stage: 'Construction', floors: 25,
    lookAhead: 'Interior design team completes final showhouse fittings within 30 days.',
    sections: [
      { id: 'structure', title: 'Construction & Structural Works', items: [
        { id: 'elevations', title: 'Elevations', progress: 100, previous: 100, note: 'All elevations remain complete.' },
        { id: 'masonry', title: 'Masonry works', progress: 92, previous: 80, floor: 23, previousFloor: 20, note: 'Stone and masonry works are on the 23rd floor.' },
        { id: 'plaster', title: 'Internal plastering', progress: 60, previous: 48, floor: 15, previousFloor: 12, note: 'Internal plastering is progressing on the 15th floor.' },
        { id: 'gypsum', title: 'Gypsum works', progress: 52, previous: 40, floor: 13, previousFloor: 10, note: 'Ceiling framing and gypsum installation are ongoing.' },
      ] },
      { id: 'showhouse', title: 'Showhouse Progress', items: [
        { id: 'one-bed', title: '1-Bedroom showhouse', progress: 65, previous: 50, note: 'Cabinetry, tiling and flooring complete. Chandeliers remaining.' },
        { id: 'two-bed', title: '2-Bedroom showhouse', progress: 60, previous: 45, note: 'Lighting 50%. Appliance fitting underway.' },
      ] },
      { id: 'amenities', title: 'Amenities', items: [
        { id: 'cinema', title: 'Cinema', progress: 90, previous: 80, note: 'Main works complete. Final door fitting pending.' },
        { id: 'other', title: 'Remaining amenities', progress: 40, previous: 30, note: 'Off-site fabrication and on-site services in progress.' },
      ] },
    ],
  },
  {
    id: 'demo-venus', name: 'Venus Oak', stage: 'Handover', floors: 25,
    lookAhead: 'Contact the on-site office for unit handover scheduling.',
    sections: [
      { id: 'external', title: 'Handover & External Works', items: [
        { id: 'gate', title: 'Frontage wall and gate', progress: 100, previous: 100, note: 'Complete.' },
        { id: 'parking', title: 'Parking areas', progress: 100, previous: 90, note: 'Parking finishes and markings complete.' },
        { id: 'landscape', title: 'Landscaping', progress: 85, previous: 70, note: 'Planting and garden areas in progress.' },
      ] },
      { id: 'venus-amenities', title: 'Amenities Status', items: [
        { id: 'library', title: 'Library, hall, gaming and kids rooms', progress: 85, previous: 70, note: 'Fabrication finalized. Awaiting fittings.' },
        { id: 'gym', title: 'Gym, laundry and theater', progress: 50, previous: 40, note: 'Structures and services are in progress.' },
      ] },
    ],
  },
  {
    id: 'demo-gemini-2', name: 'Gemini Phase 2', stage: 'Substructure', floors: 25,
    lookAhead: 'Final raft slab levelling, blinding and bottom structural works over the next 21 days.',
    sections: [{ id: 'substructure', title: 'Substructure & Site Preparation', items: [
      { id: 'excavation', title: 'Site excavation', progress: 97, previous: 85, note: 'Excavation is nearing completion.' },
      { id: 'raft', title: 'Raft slab levelling', progress: 15, previous: 0, note: 'Initial raft slab levelling has started.' },
    ] }],
  },
  { id: 'demo-project-4', name: 'Project 4', stage: 'Not started', floors: 25, lookAhead: '', sections: [] },
]
