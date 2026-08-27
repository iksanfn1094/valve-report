'use client'

import { useState } from 'react'
import { ORING_SIZES } from '@/lib/oring-data'

type TabKey = 'oring' | 'api6d' | 'api598' | 'api6a' | 'valvetest' | 'valvetest598' | 'valvetest6a' | 'fcicalc' | 'calc'

const FCI_CLASSES = ['I', 'II', 'III', 'IV', 'V', 'VI']

const FCI_VI_BUBBLES: Record<number, number> = {
  1: 0, 1.5: 1, 2: 2, 3: 4, 4: 6, 6: 12, 8: 18,
}

const FCI_VI_SIZES = [1, 1.5, 2, 3, 4, 6, 8]

const FCI_LEAKAGE = (cls: string, cv: number, sz: number, orificeDia: number) => {
  if (cls === 'I') return 'No test required'
  if (cls === 'II') return `${(cv * 0.005).toFixed(4)} Cv = ${(cv * 0.005 * 0.0006309).toExponential(2)} m³/h`
  if (cls === 'III') return `${(cv * 0.001).toFixed(4)} Cv = ${(cv * 0.001 * 0.0006309).toExponential(2)} m³/h`
  if (cls === 'IV') return `${(cv * 0.0001).toFixed(5)} Cv = ${(cv * 0.0001 * 0.0006309).toExponential(2)} m³/h`
  if (cls === 'V') {
    const mlPerMin = 0.000005 * orificeDia
    return `${mlPerMin.toExponential(2)} ml/min\n(${(mlPerMin * 0.00000211976).toExponential(2)} SCFH)`
  }
  if (cls === 'VI') {
    const matched = Object.entries(FCI_VI_BUBBLES).find(([k]) => parseFloat(k) === sz)
    const bubbles = matched ? matched[1] : 0
    const mlPerMin = bubbles * 0.01
    return `${bubbles} bubbles/min\n(${mlPerMin.toFixed(3)} ml/min)\n(${(mlPerMin * 0.00211976).toExponential(2)} SCFH)`
  }
  return '-'
}

const VALVE_TYPES_598 = ['Actuator', 'Ball Valve', 'Butterfly Valve', 'Check Valve', 'Control Valve', 'Gate Valve', 'Globe Valve', 'Plug Valve']

const VALVE_TYPES = ['Actuator', 'Ball Valve', 'Butterfly Valve', 'Check Valve', 'Control Valve', 'Gate Valve', 'Globe Valve', 'Plug Valve']

const API6A_VALVE_TYPES = ['Actuator', 'Ball Valve', 'Check Valve', 'Gate Valve', 'Globe Valve', 'Plug Valve']

const CLASS_RWP: Record<string, number> = {
  '150': 285, '300': 740, '400': 1000, '600': 1500, '900': 2250, '1500': 3750, '2500': 6250,
}

const API6A_PSL: Record<string, string[]> = {
  '1': ['Shell Test', 'Seat Test (Closure)', 'Function Test'],
  '2': ['Shell Test', 'Seat Test (Closure)', 'Function Test'],
  '3': ['Shell Test', 'Seat Test (Closure)', 'Function Test', 'Backseat Test', 'Gas Body Test', 'High-Pressure Gas Seat Test', 'Low-Pressure Gas Seat Test'],
  '3G': ['Shell Test', 'Seat Test (Closure)', 'Function Test', 'Backseat Test', 'Gas Body Test', 'High-Pressure Gas Seat Test', 'Low-Pressure Gas Seat Test'],
  '4': ['Shell Test', 'Seat Test (Closure)', 'Function Test', 'Backseat Test', 'Gas Body Test', 'High-Pressure Gas Seat Test', 'Low-Pressure Gas Seat Test', 'Drift Test'],
}

const HOLDING_TIME = (sz: number, testType: string) => {
  if (testType === 'shell') return sz <= 2 ? '2 min' : sz <= 4 ? '2 min' : sz <= 10 ? '5 min' : sz <= 18 ? '15 min' : '30 min'
  if (testType === 'seat') return sz <= 2 ? '2 min' : sz <= 4 ? '2 min' : sz <= 18 ? '5 min' : '10 min'
  if (testType === 'gas_seat') return sz <= 18 ? '15 min' : '30 min'
  if (testType === 'backseat') return sz <= 4 ? '2 min' : '5 min'
  if (testType === 'actuator_stroke') return '3 cycles (open-close-open)'
  if (testType === 'actuator_leak') return sz <= 18 ? '15 min' : '30 min'
  if (testType === 'actuator_hydro') return sz <= 4 ? '2 min' : sz <= 18 ? '10 min' : '15 min'
  return '-'
}

const ALLOWABLE_LEAKAGE = (sz: number, testType: string) => {
  if (testType === 'shell') return 'No visible leakage'
  if (testType === 'seat') {
    if (sz <= 1) return '0 bubbles/min (0 SCFH)'
    if (sz <= 2) return '1 bubble/min (0.00002 SCFH)'
    if (sz <= 4) return '2 bubbles/min (0.00004 SCFH)'
    if (sz <= 6) return '4 bubbles/min (0.00008 SCFH)'
    if (sz <= 8) return '6 bubbles/min (0.00013 SCFH)'
    if (sz <= 10) return '8 bubbles/min (0.00017 SCFH)'
    return '12 bubbles/min (0.00025 SCFH)'
  }
  if (testType === 'gas_seat') {
    if (sz <= 2) return '3.3 ml/min (0.007 SCFH)'
    if (sz <= 4) return '6.6 ml/min (0.014 SCFH)'
    if (sz <= 6) return '13.2 ml/min (0.028 SCFH)'
    if (sz <= 8) return '19.8 ml/min (0.042 SCFH)'
    return '33 ml/min (0.070 SCFH)'
  }
  if (testType === 'backseat') return 'No visible leakage'
  if (testType === 'actuator_stroke') return 'Complete full stroke ± travel limit'
  if (testType === 'actuator_leak') return 'No external leakage from actuator seals'
  if (testType === 'actuator_hydro') return 'No visible leakage from body joints'
  return '-'
}

function getTestsForValve(valveType: string) {
  if (valveType === 'Actuator') {
    return [
      { no: 1, name: 'Actuator Housing Hydrostatic Test', medium: 'Water / suitable liquid', type: 'actuator_hydro' },
      { no: 2, name: 'Actuator Stroke Test (Full Open/Close)', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' },
      { no: 3, name: 'Actuator Seal & Leak Test', medium: 'Air / inert gas', type: 'actuator_leak' },
      { no: 4, name: 'Minimum Operating Pressure Test', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' },
      { no: 5, name: 'Actuator Torque / Thrust Verification', medium: 'N/A', type: 'actuator_stroke' },
    ]
  }
  const tests: { no: number; name: string; medium: string; type: string }[] = [
    { no: 1, name: 'Hydrostatic Shell Test', medium: 'Water / suitable liquid', type: 'shell' },
    { no: 2, name: 'Hydrostatic Seat Test (Closure)', medium: 'Water / suitable liquid', type: 'seat' },
  ]
  if (valveType !== 'Check Valve' && valveType !== 'Butterfly Valve') {
    tests.push({ no: 3, name: 'Backseat Test', medium: 'Water / suitable liquid', type: 'backseat' })
  }
  tests.push({ no: tests.length + 1, name: 'High-Pressure Gas Seat Test', medium: 'Inert gas (N₂)', type: 'gas_seat' })
  tests.push({ no: tests.length + 1, name: 'Low-Pressure Gas Seat Test', medium: 'Air / inert gas', type: 'gas_seat' })
  if (valveType === 'Ball Valve' || valveType === 'Plug Valve') {
    tests.push({ no: tests.length + 1, name: 'Pneumatic Seat Test', medium: 'Air / inert gas', type: 'gas_seat' })
  }
  if (valveType === 'Control Valve') {
    tests.push({ no: tests.length + 1, name: 'Actuator Stroke Test (Full Open/Close)', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' })
    tests.push({ no: tests.length + 1, name: 'Actuator Seal & Leak Test', medium: 'Air / inert gas', type: 'actuator_leak' })
  }
  return tests
}

const API6A_HOLDING = (sz: number, testType: string) => {
  if (testType === 'shell') return sz <= 2 ? '2 min' : sz <= 4 ? '2 min' : sz <= 10 ? '5 min' : sz <= 18 ? '15 min' : '30 min'
  if (testType === 'seat') return sz <= 2 ? '2 min' : sz <= 4 ? '2 min' : sz <= 18 ? '5 min' : '10 min'
  if (testType === 'function') return 'Per design specification'
  if (testType === 'backseat') return sz <= 4 ? '2 min' : '5 min'
  if (testType === 'gas_body') return sz <= 18 ? '15 min' : '30 min'
  if (testType === 'hp_gas_seat') return sz <= 18 ? '15 min' : '30 min'
  if (testType === 'lp_gas_seat') return sz <= 18 ? '15 min' : '30 min'
  if (testType === 'drift') return 'N/A (mechanical check)'
  if (testType === 'actuator_stroke') return '3 cycles (open-close-open)'
  if (testType === 'actuator_leak') return sz <= 18 ? '15 min' : '30 min'
  if (testType === 'actuator_hydro') return sz <= 4 ? '2 min' : sz <= 18 ? '10 min' : '15 min'
  return '-'
}

const API6A_LEAKAGE = (sz: number, testType: string) => {
  if (testType === 'shell') return 'No visible leakage'
  if (testType === 'seat') {
    if (sz <= 1) return '0 bubbles/min (0 SCFH)'
    if (sz <= 2) return '1 bubble/min (0.00002 SCFH)'
    if (sz <= 4) return '2 bubbles/min (0.00004 SCFH)'
    if (sz <= 6) return '4 bubbles/min (0.00008 SCFH)'
    if (sz <= 8) return '6 bubbles/min (0.00013 SCFH)'
    if (sz <= 10) return '8 bubbles/min (0.00017 SCFH)'
    return '12 bubbles/min (0.00025 SCFH)'
  }
  if (testType === 'function') return 'Per functional specification'
  if (testType === 'backseat') return 'No visible leakage'
  if (testType === 'gas_body') {
    if (sz <= 2) return '3.3 ml/min (0.007 SCFH)'
    if (sz <= 4) return '6.6 ml/min (0.014 SCFH)'
    if (sz <= 6) return '13.2 ml/min (0.028 SCFH)'
    if (sz <= 8) return '19.8 ml/min (0.042 SCFH)'
    return '33 ml/min (0.070 SCFH)'
  }
  if (testType === 'hp_gas_seat') {
    if (sz <= 2) return '3.3 ml/min (0.007 SCFH)'
    if (sz <= 4) return '6.6 ml/min (0.014 SCFH)'
    if (sz <= 6) return '13.2 ml/min (0.028 SCFH)'
    if (sz <= 8) return '19.8 ml/min (0.042 SCFH)'
    return '33 ml/min (0.070 SCFH)'
  }
  if (testType === 'lp_gas_seat') return 'No visible leakage (bubble method)'
  if (testType === 'drift') return 'Pass / Fail — drift indicator through bore'
  if (testType === 'actuator_stroke') return 'Complete full stroke ± travel limit'
  if (testType === 'actuator_leak') return 'No external leakage from actuator seals'
  if (testType === 'actuator_hydro') return 'No visible leakage from body joints'
  return '-'
}

function getTestsFor6A(valveType: string, psl: string) {
  if (valveType === 'Actuator') {
    return [
      { no: 1, name: 'Actuator Housing Hydrostatic Test', medium: 'Water / suitable liquid', type: 'actuator_hydro' },
      { no: 2, name: 'Actuator Stroke Test (Full Open/Close)', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' },
      { no: 3, name: 'Actuator Seal & Leak Test', medium: 'Air / inert gas', type: 'actuator_leak' },
      { no: 4, name: 'Minimum Operating Pressure Test', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' },
      { no: 5, name: 'Actuator Torque / Thrust Verification', medium: 'N/A', type: 'actuator_stroke' },
    ]
  }
  const pslTests = API6A_PSL[psl] || API6A_PSL['1']
  const typeMap: Record<string, string> = {
    'Shell Test': 'shell', 'Seat Test (Closure)': 'seat', 'Function Test': 'function',
    'Backseat Test': 'backseat', 'Gas Body Test': 'gas_body',
    'High-Pressure Gas Seat Test': 'hp_gas_seat', 'Low-Pressure Gas Seat Test': 'lp_gas_seat',
    'Drift Test': 'drift',
  }
  const mediumMap: Record<string, string> = {
    'Shell Test': 'Water / suitable liquid', 'Seat Test (Closure)': 'Water / suitable liquid',
    'Function Test': 'Per design specification', 'Backseat Test': 'Water / suitable liquid',
    'Gas Body Test': 'Inert gas (N₂)', 'High-Pressure Gas Seat Test': 'Inert gas (N₂)',
    'Low-Pressure Gas Seat Test': 'Air / inert gas', 'Drift Test': 'N/A (mechanical)',
  }
  const tests = pslTests.map((name, i) => ({
    no: i + 1, name, medium: mediumMap[name] || '-', type: typeMap[name] || '-',
  }))
  if (valveType === 'Control Valve') {
    tests.push({ no: tests.length + 1, name: 'Actuator Stroke Test (Full Open/Close)', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' })
    tests.push({ no: tests.length + 1, name: 'Actuator Seal & Leak Test', medium: 'Air / inert gas', type: 'actuator_leak' })
  }
  return tests
}

const API598_HOLDING = (sz: number, testType: string) => {
  const base = sz <= 2 ? '15 sec' : sz <= 4 ? '1 min' : sz <= 8 ? '2 min' : sz <= 14 ? '5 min' : '10 min'
  if (testType === 'shell') return base
  if (testType === 'backseat') return base
  if (testType === 'hp_closure') return base
  if (testType === 'lp_closure') return base
  if (testType === 'hp_gas_closure') return base
  if (testType === 'actuator_stroke') return '3 cycles (open-close-open)'
  if (testType === 'actuator_leak') return sz <= 18 ? '15 min' : '30 min'
  if (testType === 'actuator_hydro') return sz <= 4 ? '2 min' : sz <= 18 ? '10 min' : '15 min'
  return '-'
}

const API598_LEAKAGE = (sz: number, testType: string) => {
  if (testType === 'shell') return 'No visible leakage through pressure boundary'
  if (testType === 'backseat') return 'No visible leakage'
  if (testType === 'hp_closure') {
    if (sz <= 2) return '0 bubbles/min (0 SCFH) soft seat\n1 bubble/min (0.00002 SCFH) metal seat'
    if (sz <= 4) return '1 bubble/min (0.00002 SCFH) soft seat\n2 bubbles/min (0.00004 SCFH) metal seat'
    if (sz <= 6) return '2 bubbles/min (0.00004 SCFH) soft seat\n4 bubbles/min (0.00008 SCFH) metal seat'
    if (sz <= 8) return '4 bubbles/min (0.00008 SCFH) soft seat\n6 bubbles/min (0.00013 SCFH) metal seat'
    return '6 bubbles/min (0.00013 SCFH) soft seat\n8 bubbles/min (0.00017 SCFH) metal seat'
  }
  if (testType === 'lp_closure') {
    if (sz <= 2) return 'No detectable leakage'
    if (sz <= 4) return '1 bubble/min (0.00002 SCFH)'
    if (sz <= 6) return '2 bubbles/min (0.00004 SCFH)'
    if (sz <= 8) return '4 bubbles/min (0.00008 SCFH)'
    return '6 bubbles/min (0.00013 SCFH)'
  }
  if (testType === 'hp_gas_closure') {
    if (sz <= 2) return '3.3 ml/min (0.007 SCFH)'
    if (sz <= 4) return '6.6 ml/min (0.014 SCFH)'
    if (sz <= 6) return '13.2 ml/min (0.028 SCFH)'
    if (sz <= 8) return '19.8 ml/min (0.042 SCFH)'
    return '33 ml/min (0.070 SCFH)'
  }
  if (testType === 'actuator_stroke') return 'Complete full stroke ± travel limit'
  if (testType === 'actuator_leak') return 'No external leakage from actuator seals'
  if (testType === 'actuator_hydro') return 'No visible leakage from body joints'
  return '-'
}

function getTestsFor598(valveType: string) {
  if (valveType === 'Actuator') {
    return [
      { no: 1, name: 'Actuator Housing Hydrostatic Test', medium: 'Water / suitable liquid', type: 'actuator_hydro' },
      { no: 2, name: 'Actuator Stroke Test (Full Open/Close)', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' },
      { no: 3, name: 'Actuator Seal & Leak Test', medium: 'Air / inert gas', type: 'actuator_leak' },
      { no: 4, name: 'Minimum Operating Pressure Test', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' },
      { no: 5, name: 'Actuator Torque / Thrust Verification', medium: 'N/A', type: 'actuator_stroke' },
    ]
  }
  const tests: { no: number; name: string; medium: string; type: string }[] = [
    { no: 1, name: 'Shell Test (Hydrostatic)', medium: 'Liquid (water/oil)', type: 'shell' },
  ]
  if (valveType !== 'Check Valve' && valveType !== 'Butterfly Valve') {
    tests.push({ no: 2, name: 'Backseat Test', medium: 'Liquid (water/oil)', type: 'backseat' })
  }
  tests.push({ no: tests.length + 1, name: 'High-Pressure Closure Test', medium: 'Liquid / Gas', type: 'hp_closure' })
  tests.push({ no: tests.length + 1, name: 'Low-Pressure Closure Test', medium: 'Air / Gas', type: 'lp_closure' })
  tests.push({ no: tests.length + 1, name: 'High-Pressure Gas Closure Test', medium: 'Air / inert gas', type: 'hp_gas_closure' })
  if (valveType === 'Control Valve') {
    tests.push({ no: tests.length + 1, name: 'Actuator Stroke Test (Full Open/Close)', medium: 'Hydraulic / Pneumatic supply', type: 'actuator_stroke' })
    tests.push({ no: tests.length + 1, name: 'Actuator Seal & Leak Test', medium: 'Air / inert gas', type: 'actuator_leak' })
  }
  return tests
}

const API6D_TESTS = [
  { no: 1, name: 'Hydrostatic Shell Test', medium: 'Water', pressureFormula: '≥ 1.5 × PR', holdingFn: (sz: number) => sz <= 4 ? '2 min' : sz <= 10 ? '5 min' : sz <= 18 ? '15 min' : '30 min', criteria: 'No visible leakage dari pressure-containing parts' },
  { no: 2, name: 'Hydrostatic Seat Test', medium: 'Water', pressureFormula: '≥ 1.1 × PR', holdingFn: (sz: number) => sz <= 4 ? '2 min' : sz <= 18 ? '5 min' : '10 min', criteria: 'Soft seat: ISO 5208 Rate A\nMetal seat: ISO 5208 Rate CD' },
  { no: 3, name: 'High-Pressure Gas Seat Test', medium: 'Inert gas (N₂)', pressureFormula: '≥ 1.1 × PR', holdingFn: (sz: number) => sz <= 18 ? '15 min' : '30 min', criteria: 'Sesuai API 6D gas seat test criteria' },
  { no: 4, name: 'Low-Pressure Gas Seat Test', medium: 'Air / inert gas', pressureFormula: '87–102 psi\n(0.6–0.7 MPa)', holdingFn: (sz: number) => sz <= 18 ? '15 min' : '30 min', criteria: 'Soft seat: ISO 5208 Rate A\nMetal seat: mengikuti API 6D' },
  { no: 5, name: 'Backseat Test', medium: 'Water', pressureFormula: 'Sesuai PR', holdingFn: (sz: number) => sz <= 4 ? '2 min' : '5 min', criteria: 'No visible leakage' },
]

const API598_TESTS = [
  { no: 1, name: 'Shell Test', medium: 'Liquid', pressureFormula: '1.5 × CWP', holdingFn: (sz: number) => sz <= 2 ? '15 sec' : sz <= 4 ? '1 min' : sz <= 8 ? '2 min' : sz <= 14 ? '5 min' : '10 min', criteria: 'No visible leakage through pressure boundary' },
  { no: 2, name: 'Backseat Test', medium: 'Liquid', pressureFormula: '1.1 × CWP', holdingFn: (sz: number) => sz <= 2 ? '15 sec' : sz <= 4 ? '1 min' : sz <= 8 ? '2 min' : sz <= 14 ? '5 min' : '10 min', criteria: 'No visible leakage' },
  { no: 3, name: 'High-Pressure Closure Test', medium: 'Liquid / Gas', pressureFormula: '1.1 × CWP', holdingFn: (sz: number) => sz <= 2 ? '15 sec' : sz <= 4 ? '1 min' : sz <= 8 ? '2 min' : sz <= 14 ? '5 min' : '10 min', criteria: 'Leakage ≤ allowable rate' },
  { no: 4, name: 'Low-Pressure Closure Test', medium: 'Air / Gas', pressureFormula: '80 ± 5 psi\n(5.5 ± 0.5 bar)', holdingFn: (sz: number) => sz <= 2 ? '15 sec' : sz <= 4 ? '1 min' : sz <= 8 ? '2 min' : sz <= 14 ? '5 min' : '10 min', criteria: 'Leakage ≤ allowable rate' },
  { no: 5, name: 'High-Pressure Closure Test – Gas', medium: 'Air / inert gas', pressureFormula: '1.1 × CWP', holdingFn: (sz: number) => sz <= 2 ? '15 sec' : sz <= 4 ? '1 min' : sz <= 8 ? '2 min' : sz <= 14 ? '5 min' : '10 min', criteria: 'Leakage ≤ allowable rate' },
]

const API6A_TESTS = [
  { no: 1, name: 'Hydrostatic Shell Test', medium: 'Water / suitable liquid', pressureFormula: 'Per rated working pressure\n& equipment type', holdingTime: 'PSL 1/2: primary 3 min\n+ secondary 3 min\nPSL 3/3G/4: primary 3 min\n+ secondary 15 min', criteria: 'No visible leakage', applicability: 'PSL 1, 2, 3, 4' },
  { no: 2, name: 'Hydrostatic Seat Test', medium: 'Water / suitable liquid', pressureFormula: '≥ Rated Working Pressure', holdingTime: 'Primary 3 min;\nsecondary/tertiary\nmengikuti PSL', criteria: 'No visible leakage;\nmetal-seated check valve\nmengikuti ISO 5208 Rate E', applicability: 'Valve PSL 1–4' },
  { no: 3, name: 'Function Test', medium: '—', pressureFormula: 'Operating pressure / input\nsesuai design', holdingTime: 'Sesuai functional\nrequirement', criteria: 'Valve harus operate\nproperly', applicability: 'Valve PSL 1–4' },
  { no: 4, name: 'Gas Body Test', medium: 'Gas', pressureFormula: '≥ Rated Working Pressure', holdingTime: '≥ 15 min', criteria: 'No leakage sesuai\ngas-test acceptance', applicability: 'PSL 3G & 4' },
  { no: 5, name: 'High Pressure Gas Seat Test', medium: 'Gas', pressureFormula: '≥ Rated Working Pressure', holdingTime: '≥ 15 min', criteria: 'No leakage', applicability: 'PSL 3G & 4' },
  { no: 6, name: 'Low Pressure Gas Seat Test', medium: 'Gas', pressureFormula: 'PSL 3G: 300 psi ±10%', holdingTime: '≥ 15 min', criteria: 'No leakage', applicability: 'PSL 3G & 4' },
  { no: 7, name: 'Backseat Test', medium: 'Hydrostatic / gas\nsesuai requirement', pressureFormula: 'Sesuai rated pressure /\nspecified low-pressure test', holdingTime: 'Umumnya ≥ 15 min\nuntuk gas backseat\nprimary', criteria: 'No leakage', applicability: 'Tergantung PSL /\nequipment' },
  { no: 8, name: 'Drift Test', medium: 'Mechanical drift mandrel', pressureFormula: 'Sesuai drift requirement', holdingTime: '—', criteria: 'Mandrel harus melewati\nbore', applicability: 'Valve / tree assembly' },
]

export default function EngineeringHubPage() {
  const [tab, setTab] = useState<TabKey>('oring')
  const [search, setSearch] = useState('')
  const [csFilter, setCsFilter] = useState<string>('all')
  const [calcVals, setCalcVals] = useState([''])
  const [calcResult, setCalcResult] = useState<number | null>(null)
  const [pr, setPr] = useState('')
  const [valveSize, setValveSize] = useState('')
  const [cwp, setCwp] = useState('')
  const [valveSize598, setValveSize598] = useState('')
  const [rwp6a, setRwp6a] = useState('')
  const [psl6a, setPsl6a] = useState('')
  const [vtValveType, setVtValveType] = useState('')
  const [vtClass, setVtClass] = useState('')
  const [vtSize, setVtSize] = useState('')
  const [vt6aValveType, setVt6aValveType] = useState('')
  const [vt6aClass, setVt6aClass] = useState('')
  const [vt6aSize, setVt6aSize] = useState('')
  const [vt6aPSL, setVt6aPSL] = useState('')
  const [vt598ValveType, setVt598ValveType] = useState('')
  const [vt598Class, setVt598Class] = useState('')
  const [vt598Size, setVt598Size] = useState('')
  const [fciClass, setFciClass] = useState('IV')
  const [fciCv, setFciCv] = useState('')
  const [fciSize, setFciSize] = useState('')
  const [fciOrifice, setFciOrifice] = useState('')

  const csGroups = [
    { label: 'All', value: 'all' },
    { label: 'CS 1.02mm (-001)', value: '1.02' },
    { label: 'CS 1.27mm (-002)', value: '1.27' },
    { label: 'CS 1.52mm (-003)', value: '1.52' },
    { label: 'CS 1.78mm (0xx)', value: '1.78' },
    { label: 'CS 2.62mm (1xx)', value: '2.62' },
    { label: 'CS 3.53mm (2xx)', value: '3.53' },
    { label: 'CS 5.33mm (3xx)', value: '5.33' },
    { label: 'CS 6.99mm (4xx)', value: '6.99' },
  ]

  const filtered = ORING_SIZES.filter(o => {
    const matchSearch = !search || o.id.toString().includes(search) || o.cs.toString().includes(search)
    const matchCs = csFilter === 'all' || o.cs.toString() === csFilter
    return matchSearch && matchCs
  })

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-4">
      <h1 className="text-xl font-bold text-teal-700">Engineering Hub</h1>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {([['oring', 'Standard O-Ring'], ['api6d', 'API 6D'], ['api598', 'API 598'], ['api6a', 'API 6A'], ['valvetest', '6D Valve Testing'], ['valvetest598', '598 Valve Testing'], ['valvetest6a', '6A Valve Testing'], ['fcicalc', 'Control Valve FCI 70-2'], ['calc', 'Seat Leak Test Class IV']] as [TabKey, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === k ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'oring' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={csFilter} onChange={e => setCsFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none">
              {csGroups.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
            <input type="text" placeholder="Search by ID, CS..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <p className="text-xs text-gray-500">ISO 3601-1 Class A / AS568 (USA) — {filtered.length} sizes</p>
          <div className="flex gap-6 items-start">
            {/* Table */}
            <div className="overflow-auto max-h-[500px] border rounded-lg" style={{ minWidth: 0, flex: '0 0 auto' }}>
              <table className="text-sm" style={{ width: 'auto' }}>
                <thead className="bg-teal-600 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-1.5 text-right text-xs">CS (mm)</th>
                    <th className="px-4 py-1.5 text-right text-xs">Inner Diameter (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-1 text-right text-xs">{o.cs.toFixed(2)}</td>
                      <td className="px-4 py-1 text-right text-xs">{o.id.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Illustration */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2" style={{ width: 280 }}>
              <svg viewBox="0 0 280 238" width="280" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="oringBodyGrad" cx="35%" cy="30%" r="80%">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="45%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#047857" />
                  </radialGradient>
                  <radialGradient id="oringHoleGrad" cx="50%" cy="45%" r="65%">
                    <stop offset="0%" stopColor="#eef1f4" />
                    <stop offset="70%" stopColor="#e2e6ea" />
                    <stop offset="100%" stopColor="#c8cdd3" />
                  </radialGradient>
                  <radialGradient id="oringShadowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#000000" stopOpacity="0.28" />
                    <stop offset="70%" stopColor="#000000" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Soft shadow beneath the ring */}
                <ellipse cx="125" cy="191" rx="84" ry="12" fill="url(#oringShadowGrad)" />

                {/* Engineering centerlines */}
                <line x1="40" y1="105" x2="210" y2="105" stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="10,4,2,4" opacity="0.8" />
                <line x1="125" y1="20" x2="125" y2="187" stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="10,4,2,4" opacity="0.8" />

                {/* O-ring body (donut) */}
                <circle cx="125" cy="105" r="75" fill="url(#oringBodyGrad)" stroke="#065f46" strokeWidth="2" />

                {/* Glossy highlight along top-left of the ring */}
                <path d="M82 62 A61 61 0 0 1 168 62" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.45" />

                {/* Inner hole */}
                <circle cx="125" cy="105" r="48" fill="url(#oringHoleGrad)" stroke="#9ca3af" strokeWidth="1.5" />
                {/* Subtle shadow cast inside the hole */}
                <path d="M96 76 A41 41 0 0 1 154 76" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" opacity="0.35" />

                {/* ID dimension (blue, horizontal through center) */}
                <line x1="77" y1="99" x2="77" y2="111" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="173" y1="99" x2="173" y2="111" stroke="#2563eb" strokeWidth="1.5" />
                <line x1="85" y1="105" x2="165" y2="105" stroke="#2563eb" strokeWidth="1.2" />
                <polygon points="77,105 85,101.5 85,108.5" fill="#2563eb" />
                <polygon points="173,105 165,101.5 165,108.5" fill="#2563eb" />
                <rect x="111" y="97" width="28" height="16" rx="3" fill="white" fillOpacity="0.9" />
                <text x="125" y="109" textAnchor="middle" fill="#2563eb" fontSize="11" fontWeight="bold">ID</text>

                {/* CS dimension (red, vertical, right side showing ring thickness) */}
                <line x1="127" y1="30" x2="220" y2="30" stroke="#dc2626" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="127" y1="57" x2="220" y2="57" stroke="#dc2626" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="212" y1="38" x2="212" y2="49" stroke="#dc2626" strokeWidth="1.2" />
                <polygon points="212,30 208.5,38 215.5,38" fill="#dc2626" />
                <polygon points="212,57 208.5,49 215.5,49" fill="#dc2626" />
                <rect x="198" y="37" width="28" height="13" rx="3" fill="white" fillOpacity="0.9" />
                <text x="212" y="47" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="bold">CS</text>

                {/* OD dimension (purple, bottom) */}
                <line x1="50" y1="112" x2="50" y2="212" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="200" y1="112" x2="200" y2="212" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.7" />
                <line x1="58" y1="206" x2="192" y2="206" stroke="#7c3aed" strokeWidth="1.2" />
                <polygon points="50,206 58,202.5 58,209.5" fill="#7c3aed" />
                <polygon points="200,206 192,202.5 192,209.5" fill="#7c3aed" />
                <rect x="71" y="199" width="108" height="15" rx="3" fill="white" fillOpacity="0.9" />
                <text x="125" y="210.5" textAnchor="middle" fill="#7c3aed" fontSize="11" fontWeight="bold">OD = ID + 2×CS</text>
              </svg>
              <p className="text-xs font-semibold text-gray-700">O-Ring Dimensions</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span className="text-xs text-gray-600"><b>ID</b> = Inner Diameter</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span className="text-xs text-gray-600"><b>CS</b> = Cross Section</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span className="text-xs text-gray-600"><b>OD</b> = Outer Diameter</span>
                </div>
              </div>
              </div>
          </div>
        </div>
      )}

      {tab === 'api6d' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">API 6D — Pipeline and Piping Valve Standard — Pressure Test Requirements</p>

          {/* Reference Table */}
          <div className="overflow-auto border rounded-lg">
            <table className="text-sm w-full">
              <thead className="bg-teal-600 text-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center text-xs w-8">No</th>
                  <th className="px-3 py-2 text-left text-xs">Pressure Test</th>
                  <th className="px-3 py-2 text-left text-xs">Test Medium</th>
                  <th className="px-3 py-2 text-left text-xs">Min Test Pressure</th>
                  <th className="px-3 py-2 text-left text-xs">Holding Time</th>
                  <th className="px-3 py-2 text-left text-xs">Leakage / Acceptance Criteria</th>
                </tr>
              </thead>
              <tbody>
                {API6D_TESTS.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-center text-xs font-semibold">{t.no}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-800">{t.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{t.medium}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 font-mono whitespace-pre-line">{t.pressureFormula}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.holdingFn(99)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculator */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-lg">
            <p className="text-sm font-semibold text-gray-700">Quick Calculator</p>
            <p className="text-xs text-gray-400">Pilih Pressure Class atau input langsung Pressure Rating (bar)</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Pressure Class</label>
                <select value={pr} onChange={e => setPr(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Pilih Class —</option>
                <option value="285">Class 150 (285 psi)</option>
                <option value="740">Class 300 (740 psi)</option>
                <option value="1000">Class 400 (1000 psi)</option>
                <option value="1500">Class 600 (1500 psi)</option>
                <option value="2250">Class 900 (2250 psi)</option>
                <option value="3750">Class 1500 (3750 psi)</option>
                <option value="6250">Class 2500 (6250 psi)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Pressure Rating (psi)</label>
                <input type="number" step="1" value={pr} onChange={e => setPr(e.target.value)} placeholder="e.g. 1500" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Valve Size (inch)</label>
                <input type="number" step="1" value={valveSize} onChange={e => setValveSize(e.target.value)} placeholder="e.g. 6" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
            </div>
            {pr && valveSize && (
              <div className="mt-2 overflow-auto">
                <table className="text-xs w-full">
                  <thead className="bg-teal-100 text-teal-800">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Test</th>
                      <th className="px-2 py-1.5 text-right">Test Pressure</th>
                      <th className="px-2 py-1.5 text-left">Holding Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {API6D_TESTS.map((t, i) => {
                      const prVal = parseFloat(pr)
                      const sz = parseFloat(valveSize)
                      let pressure = '-'
                      if (t.no === 1) pressure = `${(prVal * 1.5).toFixed(0)} psi`
                      else if (t.no <= 3) pressure = `${(prVal * 1.1).toFixed(0)} psi`
                      else if (t.no === 4) pressure = '87–102 psi (0.6–0.7 MPa)'
                      else pressure = `${prVal.toFixed(0)} psi`
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1.5 font-semibold">{t.name}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{pressure}</td>
                          <td className="px-2 py-1.5">{t.holdingFn(sz)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'api598' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">API 598 — Valve Inspection and Testing — Pressure Test Requirements</p>

          {/* Reference Table */}
          <div className="overflow-auto border rounded-lg">
            <table className="text-sm w-full">
              <thead className="bg-teal-600 text-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center text-xs w-8">No</th>
                  <th className="px-3 py-2 text-left text-xs">Test</th>
                  <th className="px-3 py-2 text-left text-xs">Test Medium</th>
                  <th className="px-3 py-2 text-left text-xs">Test Pressure</th>
                  <th className="px-3 py-2 text-left text-xs">Min Duration</th>
                  <th className="px-3 py-2 text-left text-xs">Acceptance Criteria</th>
                </tr>
              </thead>
              <tbody>
                {API598_TESTS.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-center text-xs font-semibold">{t.no}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-800">{t.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{t.medium}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 font-mono whitespace-pre-line">{t.pressureFormula}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.holdingFn(99)}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculator */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-lg">
            <p className="text-sm font-semibold text-gray-700">Quick Calculator</p>
            <p className="text-xs text-gray-400">Pilih Pressure Class atau input langsung CWP (psi), lalu masukkan Valve Size (inch)</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Pressure Class</label>
                <select value={cwp} onChange={e => setCwp(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Pilih Class —</option>
                  <option value="285">Class 150 (285 psi)</option>
                  <option value="740">Class 300 (740 psi)</option>
                  <option value="1000">Class 400 (1000 psi)</option>
                  <option value="1500">Class 600 (1500 psi)</option>
                  <option value="2250">Class 900 (2250 psi)</option>
                  <option value="3750">Class 1500 (3750 psi)</option>
                  <option value="6250">Class 2500 (6250 psi)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">CWP (psi)</label>
                <input type="number" step="1" value={cwp} onChange={e => setCwp(e.target.value)} placeholder="e.g. 1500" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Valve Size (inch)</label>
                <input type="number" step="1" value={valveSize598} onChange={e => setValveSize598(e.target.value)} placeholder="e.g. 6" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
            </div>
            {cwp && valveSize598 && (
              <div className="mt-2 overflow-auto">
                <table className="text-xs w-full">
                  <thead className="bg-teal-100 text-teal-800">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Test</th>
                      <th className="px-2 py-1.5 text-right">Test Pressure</th>
                      <th className="px-2 py-1.5 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {API598_TESTS.map((t, i) => {
                      const cwpVal = parseFloat(cwp)
                      const sz = parseFloat(valveSize598)
                      let pressure = '-'
                      if (t.no === 1) pressure = `${(cwpVal * 1.5).toFixed(0)} psi`
                      else if (t.no === 4) pressure = '80 ± 5 psi (5.5 ± 0.5 bar)'
                      else pressure = `${(cwpVal * 1.1).toFixed(0)} psi`
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1.5 font-semibold">{t.name}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{pressure}</td>
                          <td className="px-2 py-1.5">{t.holdingFn(sz)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'api6a' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">API 6A — Wellhead and Christmas Tree Equipment — Pressure Test Requirements</p>

          {/* Reference Table */}
          <div className="overflow-auto border rounded-lg">
            <table className="text-sm w-full">
              <thead className="bg-teal-600 text-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-center text-xs w-8">No</th>
                  <th className="px-3 py-2 text-left text-xs">Test</th>
                  <th className="px-3 py-2 text-left text-xs">Test Medium</th>
                  <th className="px-3 py-2 text-left text-xs">Test Pressure</th>
                  <th className="px-3 py-2 text-left text-xs">Holding Time</th>
                  <th className="px-3 py-2 text-left text-xs">Leakage / Acceptance Criteria</th>
                  <th className="px-3 py-2 text-left text-xs">Applicability</th>
                </tr>
              </thead>
              <tbody>
                {API6A_TESTS.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 text-center text-xs font-semibold">{t.no}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-800">{t.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.medium}</td>
                    <td className="px-3 py-2 text-xs text-gray-700 font-mono whitespace-pre-line">{t.pressureFormula}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.holdingTime}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.criteria}</td>
                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">{t.applicability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculator */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-2xl">
            <p className="text-sm font-semibold text-gray-700">Quick Calculator</p>
            <p className="text-xs text-gray-400">Input Rated Working Pressure (psi) dan pilih PSL untuk melihat test pressures & holding time</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Pressure Class</label>
                <select value={rwp6a} onChange={e => setRwp6a(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Pilih Class —</option>
                  <option value="285">Class 150 (285 psi)</option>
                  <option value="740">Class 300 (740 psi)</option>
                  <option value="1000">Class 400 (1000 psi)</option>
                  <option value="1500">Class 600 (1500 psi)</option>
                  <option value="2250">Class 900 (2250 psi)</option>
                  <option value="3750">Class 1500 (3750 psi)</option>
                  <option value="6250">Class 2500 (6250 psi)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">RWP (psi)</label>
                <input type="number" step="1" value={rwp6a} onChange={e => setRwp6a(e.target.value)} placeholder="e.g. 1500" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">PSL Level</label>
                <select value={psl6a} onChange={e => setPsl6a(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Pilih PSL —</option>
                  <option value="1">PSL 1</option>
                  <option value="2">PSL 2</option>
                  <option value="3">PSL 3</option>
                  <option value="3G">PSL 3G</option>
                  <option value="4">PSL 4</option>
                </select>
              </div>
            </div>
            {rwp6a && psl6a && (
              <div className="mt-2 overflow-auto">
                <table className="text-xs w-full">
                  <thead className="bg-teal-100 text-teal-800">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Test</th>
                      <th className="px-2 py-1.5 text-right">Test Pressure</th>
                      <th className="px-2 py-1.5 text-left">Holding Time</th>
                      <th className="px-2 py-1.5 text-left">Applicability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {API6A_TESTS.map((t, i) => {
                      const rwpVal = parseFloat(rwp6a)
                      let pressure = '-'
                      let holding = t.holdingTime
                      let applicable = true

                      if (t.no === 1) {
                        pressure = `${rwpVal} psi (Hydrostatic)`
                      } else if (t.no === 2) {
                        pressure = `${rwpVal} psi (≥ RWP)`
                      } else if (t.no === 3) {
                        pressure = 'Per design'
                        holding = 'Per functional req.'
                      } else if (t.no === 4) {
                        applicable = psl6a === '3G' || psl6a === '4'
                        pressure = applicable ? `${rwpVal} psi (≥ RWP)` : '-'
                      } else if (t.no === 5) {
                        applicable = psl6a === '3G' || psl6a === '4'
                        pressure = applicable ? `${rwpVal} psi (≥ RWP)` : '-'
                      } else if (t.no === 6) {
                        applicable = psl6a === '3G' || psl6a === '4'
                        pressure = applicable ? '270–330 psi\n(300 ± 10%)' : '-'
                      } else if (t.no === 7) {
                        pressure = `${rwpVal} psi (per RWP)`
                      } else if (t.no === 8) {
                        pressure = 'N/A (mechanical)'
                        holding = 'N/A'
                      }

                      if (!applicable) return null

                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1.5 font-semibold">{t.name}</td>
                          <td className="px-2 py-1.5 text-right font-mono whitespace-pre-line">{pressure}</td>
                          <td className="px-2 py-1.5 whitespace-pre-line">{holding}</td>
                          <td className="px-2 py-1.5 whitespace-pre-line">{t.applicability}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'valvetest' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">API 6D — Valve Pressure Testing Calculator — Select valve type, class & size to generate test requirements</p>

          {/* Input Form */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-3xl">
            <p className="text-sm font-semibold text-gray-700">Valve Configuration</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-500">Valve Type</label>
                <select value={vtValveType} onChange={e => setVtValveType(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Select Valve —</option>
                  {VALVE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Class</label>
                <select value={vtClass} onChange={e => setVtClass(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Select Class —</option>
                  {Object.keys(CLASS_RWP).map(c => <option key={c} value={c}>Class {c} ({CLASS_RWP[c]} psi)</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Size (inch)</label>
                <input type="number" step="0.5" min="0.5" value={vtSize} onChange={e => setVtSize(e.target.value)} placeholder="e.g. 6" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
            </div>
          </div>

          {/* Results */}
          {vtValveType && vtClass && vtSize && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex gap-6 text-sm">
                <span className="text-gray-600"><b>Valve:</b> {vtValveType}</span>
                <span className="text-gray-600"><b>Class:</b> {vtClass}</span>
                <span className="text-gray-600"><b>Size:</b> {vtSize}&quot;</span>
                <span className="text-gray-600"><b>RWP:</b> {CLASS_RWP[vtClass]} psi</span>
              </div>

              {/* Test Table */}
              <div className="overflow-auto border rounded-lg">
                <table className="text-sm w-full">
                  <thead className="bg-teal-600 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs w-8">No</th>
                      <th className="px-3 py-2 text-left text-xs">Test</th>
                      <th className="px-3 py-2 text-left text-xs">Medium</th>
                      <th className="px-3 py-2 text-right text-xs">Test Pressure (psi)</th>
                      <th className="px-3 py-2 text-left text-xs">Holding Time</th>
                      <th className="px-3 py-2 text-left text-xs">Allowable Leakage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTestsForValve(vtValveType).map((t, i) => {
                      const rwp = CLASS_RWP[vtClass]
                      const sz = parseFloat(vtSize)
                      let pressure = 0
                      if (t.type === 'shell') pressure = rwp * 1.5
                      else if (t.type === 'seat') pressure = rwp * 1.1
                      else if (t.type === 'backseat') pressure = rwp * 1.1
                      else if (t.name.includes('High-Pressure')) pressure = rwp * 1.1
                      else if (t.name.includes('Low-Pressure')) pressure = 300
                      else if (t.type === 'gas_seat') pressure = rwp * 1.1
                      else if (t.type === 'actuator_hydro') pressure = rwp * 1.5
                      else if (t.name.includes('Minimum Operating')) pressure = rwp * 0.6
                      else if (t.type === 'actuator_stroke') pressure = 0
                      else if (t.type === 'actuator_leak') pressure = 0
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-center text-xs font-semibold">{t.no}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-800">{t.name}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">{t.medium}</td>
                          <td className="px-3 py-2 text-xs text-gray-700 font-mono text-right whitespace-nowrap">
                            {t.type === 'actuator_stroke' ? 'Per stroke requirement' :
                             t.type === 'actuator_leak' ? 'Per seal pressure rating' :
                             pressure > 0 ? `${pressure.toLocaleString()} psi` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {HOLDING_TIME(sz,
                              t.name.includes('High-Pressure') || t.name.includes('Low-Pressure') ? 'gas_seat' :
                              t.name.includes('Stroke') || t.name.includes('Operating') || t.name.includes('Torque') ? 'actuator_stroke' :
                              t.name.includes('Seal') && t.type === 'actuator_leak' ? 'actuator_leak' :
                              t.type === 'actuator_hydro' ? 'actuator_hydro' :
                              t.type
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {ALLOWABLE_LEAKAGE(sz,
                              t.name.includes('High-Pressure') || t.name.includes('Low-Pressure') ? 'gas_seat' :
                              t.name.includes('Stroke') || t.name.includes('Operating') || t.name.includes('Torque') ? 'actuator_stroke' :
                              t.type === 'actuator_leak' ? 'actuator_leak' :
                              t.type === 'actuator_hydro' ? 'actuator_hydro' :
                              t.type
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 space-y-1">
                <p><b>Notes — Valve:</b></p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>Shell Test pressure = 1.5 × RWP (rated working pressure)</li>
                  <li>Seat Test pressure = 1.1 × RWP</li>
                  <li>Backseat Test = 1.1 × RWP (not applicable for Check Valve & Butterfly Valve)</li>
                  <li>Low-Pressure Gas Seat Test = 300 psi (for all PSL levels)</li>
                  <li>Holding time per API 6D Table 2 based on valve size</li>
                  <li>Allowable leakage per API 6D Table 3 (liquid seat test) and Table 4 (gas seat test)</li>
                  <li>Control Valve includes actuator stroke &amp; seal test in addition to standard valve tests</li>
                </ul>
                {(vtValveType === 'Actuator' || vtValveType === 'Control Valve') && (
                  <>
                    <p className="mt-2"><b>Notes — Actuator:</b></p>
                    <ul className="list-disc ml-4 space-y-0.5">
                      <li>Actuator Housing Hydrostatic = 1.5 × RWP (body integrity)</li>
                      <li>Stroke Test = 3 full open-close cycles, verify full travel &amp; response time</li>
                      <li>Seal &amp; Leak Test = pressurize actuator cavity, check external seals</li>
                      <li>Minimum Operating Pressure Test = 60% RWP (supply pressure to confirm actuation)</li>
                      <li>Torque / Thrust Verification = compare against required seat load per API 6D</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'valvetest598' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">API 598 — Valve Inspection and Testing — Valve Pressure Testing Calculator</p>

          {/* Input Form */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-3xl">
            <p className="text-sm font-semibold text-gray-700">Valve Configuration</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-500">Valve Type</label>
                <select value={vt598ValveType} onChange={e => setVt598ValveType(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Select Valve —</option>
                  {VALVE_TYPES_598.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Class</label>
                <select value={vt598Class} onChange={e => setVt598Class(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Select Class —</option>
                  {Object.keys(CLASS_RWP).map(c => <option key={c} value={c}>Class {c} ({CLASS_RWP[c]} psi)</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Size (inch)</label>
                <input type="number" step="0.5" min="0.5" value={vt598Size} onChange={e => setVt598Size(e.target.value)} placeholder="e.g. 6" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
            </div>
          </div>

          {/* Results */}
          {vt598ValveType && vt598Class && vt598Size && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex gap-6 text-sm flex-wrap">
                <span className="text-gray-600"><b>Valve:</b> {vt598ValveType}</span>
                <span className="text-gray-600"><b>Class:</b> {vt598Class}</span>
                <span className="text-gray-600"><b>Size:</b> {vt598Size}&quot;</span>
                <span className="text-gray-600"><b>CWP:</b> {CLASS_RWP[vt598Class]} psi</span>
              </div>

              {/* Test Table */}
              <div className="overflow-auto border rounded-lg">
                <table className="text-sm w-full">
                  <thead className="bg-teal-600 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs w-8">No</th>
                      <th className="px-3 py-2 text-left text-xs">Test</th>
                      <th className="px-3 py-2 text-left text-xs">Medium</th>
                      <th className="px-3 py-2 text-right text-xs">Test Pressure (psi)</th>
                      <th className="px-3 py-2 text-left text-xs">Holding Time</th>
                      <th className="px-3 py-2 text-left text-xs">Allowable Leakage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTestsFor598(vt598ValveType).map((t, i) => {
                      const cwp = CLASS_RWP[vt598Class]
                      const sz = parseFloat(vt598Size)
                      let pressure = 0
                      if (t.type === 'shell') pressure = cwp * 1.5
                      else if (t.type === 'backseat') pressure = cwp * 1.1
                      else if (t.type === 'hp_closure') pressure = cwp * 1.1
                      else if (t.type === 'lp_closure') pressure = 80
                      else if (t.type === 'hp_gas_closure') pressure = cwp * 1.1
                      else if (t.type === 'actuator_hydro') pressure = cwp * 1.5
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-center text-xs font-semibold">{t.no}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-800">{t.name}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">{t.medium}</td>
                          <td className="px-3 py-2 text-xs text-gray-700 font-mono text-right whitespace-nowrap">
                            {t.type === 'actuator_stroke' ? 'Per stroke requirement' :
                             t.type === 'actuator_leak' ? 'Per seal pressure rating' :
                             t.type === 'lp_closure' ? '80 ± 5 psi (5.5 ± 0.5 bar)' :
                             pressure > 0 ? `${pressure.toLocaleString()} psi` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {API598_HOLDING(sz, t.type)}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 whitespace-pre-line">
                            {API598_LEAKAGE(sz, t.type)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 space-y-1">
                <p><b>Notes — API 598 Valve:</b></p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>Shell Test = 1.5 × CWP (Class Working Pressure)</li>
                  <li>Backseat Test = 1.1 × CWP (not applicable for Check Valve &amp; Butterfly Valve)</li>
                  <li>High-Pressure Closure Test = 1.1 × CWP (liquid medium)</li>
                  <li>Low-Pressure Closure Test = 80 ± 5 psi (5.5 ± 0.5 bar)</li>
                  <li>High-Pressure Gas Closure Test = 1.1 × CWP (gas medium, ml/min + SCFH)</li>
                  <li>Holding time per API 598 Table 1 based on valve size</li>
                  <li>Allowable leakage per API 598 Table 2 (liquid) and Table 3 (gas)</li>
                  <li>Control Valve includes actuator stroke &amp; seal test</li>
                </ul>
                {(vt598ValveType === 'Actuator' || vt598ValveType === 'Control Valve') && (
                  <>
                    <p className="mt-2"><b>Notes — Actuator:</b></p>
                    <ul className="list-disc ml-4 space-y-0.5">
                      <li>Actuator Housing Hydrostatic = 1.5 × CWP (body integrity)</li>
                      <li>Stroke Test = 3 full open-close cycles, verify full travel &amp; response time</li>
                      <li>Seal &amp; Leak Test = pressurize actuator cavity, check external seals</li>
                      <li>Minimum Operating Pressure Test = 60% CWP (supply pressure to confirm actuation)</li>
                      <li>Torque / Thrust Verification = compare against required seat load</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'valvetest6a' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">API 6A — Wellhead & Christmas Tree Equipment — Valve Pressure Testing Calculator</p>

          {/* Input Form */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-3xl">
            <p className="text-sm font-semibold text-gray-700">Valve Configuration</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-gray-500">Valve Type</label>
                <select value={vt6aValveType} onChange={e => setVt6aValveType(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Select Valve —</option>
                  {API6A_VALVE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Pressure Class</label>
                <select value={vt6aClass} onChange={e => setVt6aClass(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Select Class —</option>
                  {Object.keys(CLASS_RWP).map(c => <option key={c} value={c}>Class {c} ({CLASS_RWP[c]} psi)</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Size (inch)</label>
                <input type="number" step="0.5" min="0.5" value={vt6aSize} onChange={e => setVt6aSize(e.target.value)} placeholder="e.g. 7-1/16" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">PSL Level</label>
                <select value={vt6aPSL} onChange={e => setVt6aPSL(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  <option value="">— Select PSL —</option>
                  <option value="1">PSL 1</option>
                  <option value="2">PSL 2</option>
                  <option value="3">PSL 3</option>
                  <option value="3G">PSL 3G</option>
                  <option value="4">PSL 4</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {vt6aValveType && vt6aClass && vt6aSize && vt6aPSL && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex gap-6 text-sm flex-wrap">
                <span className="text-gray-600"><b>Valve:</b> {vt6aValveType}</span>
                <span className="text-gray-600"><b>Class:</b> {vt6aClass}</span>
                <span className="text-gray-600"><b>Size:</b> {vt6aSize}&quot;</span>
                <span className="text-gray-600"><b>PSL:</b> {vt6aPSL}</span>
                <span className="text-gray-600"><b>RWP:</b> {CLASS_RWP[vt6aClass]} psi</span>
              </div>

              {/* PSL info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <b>PSL {vt6aPSL}</b> — Tests required:{' '}
                {(API6A_PSL[vt6aPSL] || []).join(', ')}
                {vt6aValveType === 'Control Valve' ? ', Actuator Stroke Test, Actuator Seal & Leak Test' : ''}
              </div>

              {/* Test Table */}
              <div className="overflow-auto border rounded-lg">
                <table className="text-sm w-full">
                  <thead className="bg-teal-600 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs w-8">No</th>
                      <th className="px-3 py-2 text-left text-xs">Test</th>
                      <th className="px-3 py-2 text-left text-xs">Medium</th>
                      <th className="px-3 py-2 text-right text-xs">Test Pressure (psi)</th>
                      <th className="px-3 py-2 text-left text-xs">Holding Time</th>
                      <th className="px-3 py-2 text-left text-xs">Allowable Leakage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTestsFor6A(vt6aValveType, vt6aPSL).map((t, i) => {
                      const rwp = CLASS_RWP[vt6aClass]
                      const sz = parseFloat(vt6aSize)
                      let pressure = 0
                      if (t.type === 'shell') pressure = rwp * 1.5
                      else if (t.type === 'seat') pressure = rwp * 1.1
                      else if (t.type === 'backseat') pressure = rwp * 1.1
                      else if (t.type === 'gas_body') pressure = rwp * 1.1
                      else if (t.type === 'hp_gas_seat') pressure = rwp * 1.1
                      else if (t.type === 'lp_gas_seat') pressure = 300
                      else if (t.type === 'actuator_hydro') pressure = rwp * 1.5
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-center text-xs font-semibold">{t.no}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-800">{t.name}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">{t.medium}</td>
                          <td className="px-3 py-2 text-xs text-gray-700 font-mono text-right whitespace-nowrap">
                            {t.type === 'function' ? 'Per design spec' :
                             t.type === 'drift' ? 'N/A (mechanical)' :
                             t.type === 'actuator_stroke' ? 'Per stroke requirement' :
                             t.type === 'actuator_leak' ? 'Per seal pressure rating' :
                             pressure > 0 ? `${pressure.toLocaleString()} psi` : '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {API6A_HOLDING(sz,
                              t.type === 'function' ? 'function' :
                              t.type === 'drift' ? 'drift' :
                              t.type === 'actuator_stroke' ? 'actuator_stroke' :
                              t.type === 'actuator_leak' ? 'actuator_leak' :
                              t.type === 'actuator_hydro' ? 'actuator_hydro' :
                              t.type
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {API6A_LEAKAGE(sz,
                              t.type === 'function' ? 'function' :
                              t.type === 'drift' ? 'drift' :
                              t.type === 'actuator_stroke' ? 'actuator_stroke' :
                              t.type === 'actuator_leak' ? 'actuator_leak' :
                              t.type === 'actuator_hydro' ? 'actuator_hydro' :
                              t.type
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 space-y-1">
                <p><b>Notes — API 6A Valve:</b></p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>Shell Test = 1.5 × RWP (pressure-containing body integrity)</li>
                  <li>Seat Test (Closure) = 1.1 × RWP</li>
                  <li>Backseat Test = 1.1 × RWP (gate valve, plug valve only — not check valve)</li>
                  <li>Gas Body Test = 1.1 × RWP — <b>PSL 3, 3G, 4 only</b></li>
                  <li>High-Pressure Gas Seat Test = 1.1 × RWP — <b>PSL 3, 3G, 4 only</b></li>
                  <li>Low-Pressure Gas Seat Test = 300 ± 10% psi — <b>PSL 3, 3G, 4 only</b></li>
                  <li>Drift Test = mechanical bore check — <b>PSL 4 only</b></li>
                  <li>Holding time per API 6A Table F.1 / Section 7</li>
                  <li>Allowable leakage per API 6D Table 3 (liquid) and Table 4 (gas)</li>
                  <li>Control Valve includes actuator stroke &amp; seal test</li>
                </ul>
                {(vt6aValveType === 'Actuator' || vt6aValveType === 'Control Valve') && (
                  <>
                    <p className="mt-2"><b>Notes — Actuator:</b></p>
                    <ul className="list-disc ml-4 space-y-0.5">
                      <li>Actuator Housing Hydrostatic = 1.5 × RWP (body integrity)</li>
                      <li>Stroke Test = 3 full open-close cycles, verify full travel &amp; response time</li>
                      <li>Seal &amp; Leak Test = pressurize actuator cavity, check external seals</li>
                      <li>Minimum Operating Pressure Test = 60% RWP (supply pressure to confirm actuation)</li>
                      <li>Torque / Thrust Verification = compare against required seat load per API 6A</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'fcicalc' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">FCI 70-2 — Control Valve Seat Leakage Classification — Test Requirements & Calculator</p>

          {/* Input Form */}
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-3xl">
            <p className="text-sm font-semibold text-gray-700">Valve Configuration</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Leakage Class</label>
                <select value={fciClass} onChange={e => setFciClass(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                  {FCI_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Rated Cv (Flow Coefficient)</label>
                <input type="number" step="0.1" min="0" value={fciCv} onChange={e => setFciCv(e.target.value)} placeholder="e.g. 150" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500">Valve Size (inch)</label>
                <input type="number" step="0.5" min="0.5" value={fciSize} onChange={e => setFciSize(e.target.value)} placeholder="e.g. 4" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
              </div>
              {(fciClass === 'V' || fciClass === 'VI') && (
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs text-gray-500">{fciClass === 'V' ? 'Orifice Diameter (inch)' : 'Valve Size (inch) (for bubbles)'}</label>
                  {fciClass === 'V' ? (
                    <input type="number" step="0.1" min="0" value={fciOrifice} onChange={e => setFciOrifice(e.target.value)} placeholder="e.g. 2.0" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" />
                  ) : (
                    <select value={fciSize} onChange={e => setFciSize(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1">
                      <option value="">— Select Size —</option>
                      {FCI_VI_SIZES.map(s => <option key={s} value={s}>{s}&quot;</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {fciCv && fciSize && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex gap-6 text-sm flex-wrap">
                <span className="text-gray-600"><b>Class:</b> {fciClass}</span>
                <span className="text-gray-600"><b>Cv:</b> {fciCv}</span>
                <span className="text-gray-600"><b>Size:</b> {fciSize}&quot;</span>
                {fciClass === 'V' && <span className="text-gray-600"><b>Orifice:</b> {fciOrifice || '-'}&quot;</span>}
              </div>

              {/* Reference Table — All Classes */}
              <div className="overflow-auto border rounded-lg">
                <table className="text-sm w-full">
                  <thead className="bg-teal-600 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs w-12">Class</th>
                      <th className="px-3 py-2 text-left text-xs">Test Medium</th>
                      <th className="px-3 py-2 text-left text-xs">Test Pressure</th>
                      <th className="px-3 py-2 text-left text-xs">Allowable Leakage</th>
                      <th className="px-3 py-2 text-left text-xs">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FCI_CLASSES.map((cls, i) => {
                      const cv = parseFloat(fciCv) || 0
                      const sz = parseFloat(fciSize) || 0
                      const orifice = parseFloat(fciOrifice) || 0
                      const isSelected = cls === fciClass
                      const medians = cls === 'I' ? 'N/A' : cls === 'V' ? 'Water' : cls === 'VI' ? 'Air / N₂' : 'Water'
                      const pressures = cls === 'I' ? 'N/A' : cls === 'V' ? 'Max ΔP (rated)' : cls === 'VI' ? '50 psi (0.34 MPa)' : 'Max ΔP (rated)'
                      const descriptions = [
                        'No seat leakage test required',
                        '0.5% of rated Cv — minimal seat leakage',
                        '0.1% of rated Cv — tight shutoff',
                        '0.01% of rated Cv — very tight shutoff',
                        'Water test — 5 × 10⁻⁴ ml/min per inch orifice dia',
                        'Air test — bubble count method per valve size',
                      ]
                      return (
                        <tr key={i} className={`${isSelected ? 'bg-teal-50 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-2 text-center text-xs">
                            {isSelected && <span className="text-teal-600 mr-1">&#9654;</span>}
                            <b>Class {cls}</b>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">{medians}</td>
                          <td className="px-3 py-2 text-xs text-gray-700 font-mono">{pressures}</td>
                          <td className="px-3 py-2 text-xs text-gray-700 font-mono whitespace-pre-line">
                            {cls === 'I' ? '-' : FCI_LEAKAGE(cls, cv, sz, orifice)}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">{descriptions[i]}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Selected Class Detail */}
              {fciCv && fciSize && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800 space-y-2">
                  <p className="font-semibold text-sm text-blue-900">Class {fciClass} — Detailed Result</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><b>Test Medium:</b> {fciClass === 'I' ? 'N/A' : fciClass === 'V' ? 'Water' : fciClass === 'VI' ? 'Air / N₂ (inert gas)' : 'Water'}</p>
                      <p><b>Test Pressure:</b> {fciClass === 'I' ? 'N/A' : fciClass === 'V' ? 'Maximum rated differential pressure (closed valve)' : fciClass === 'VI' ? '50 ± 5 psi (0.34 ± 0.03 MPa)' : 'Maximum rated differential pressure (closed valve)'}</p>
                      <p><b>Valve Position:</b> Fully open, then close for test</p>
                    </div>
                    <div>
                      <p><b>Allowable Leakage:</b></p>
                      <p className="font-mono mt-1">{FCI_LEAKAGE(fciClass, parseFloat(fciCv) || 0, parseFloat(fciSize) || 0, parseFloat(fciOrifice) || 0)}</p>
                      <p className="mt-1"><b>Formula:</b></p>
                      <p className="font-mono text-[10px]">
                        {fciClass === 'I' && 'No test required'}
                        {fciClass === 'II' && `Allowable = 0.5% × Cv = 0.005 × ${fciCv} = ${(parseFloat(fciCv) * 0.005).toFixed(4)}`}
                        {fciClass === 'III' && `Allowable = 0.1% × Cv = 0.001 × ${fciCv} = ${(parseFloat(fciCv) * 0.001).toFixed(4)}`}
                        {fciClass === 'IV' && `Allowable = 0.01% × Cv = 0.0001 × ${fciCv} = ${(parseFloat(fciCv) * 0.0001).toFixed(5)}`}
                        {fciClass === 'V' && `Allowable = 0.000005 × orifice dia = 0.000005 × ${fciOrifice || '?'} = ${((parseFloat(fciOrifice) || 0) * 0.000005).toExponential(2)} ml/min`}
                        {fciClass === 'VI' && `Bubbles/min per API 6D Table — size ${fciSize}"`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 space-y-1">
                <p><b>Notes — FCI 70-2 Control Valve Seat Leakage:</b></p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>Class I: No test required (optional visual inspection)</li>
                  <li>Class II: 0.5% of rated Cv — minimal seat leakage</li>
                  <li>Class III: 0.1% of rated Cv — tight shutoff</li>
                  <li>Class IV: 0.01% of rated Cv — very tight shutoff (most common spec)</li>
                  <li>Class V: Water test — 5 × 10⁻⁴ ml/min per inch of orifice diameter at max ΔP</li>
                  <li>Class VI: Air/N₂ test — bubble count method per valve size at 50 psi</li>
                  <li>All classes except V &amp; VI use water at maximum rated differential pressure</li>
                  <li>Cv = rated flow coefficient of the valve (full open)</li>
                  <li>SCFH conversion: 1 ml/min = 0.00211976 SCFH</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'calc' && (
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3 max-w-md">
            <p className="text-sm text-gray-500 font-mono">SCFH = Cv × 3.1 × 0.001 × 60</p>
            <p className="text-xs text-gray-400">3.1 = conversion constant, 0.001 = unit factor, 60 = sec→min</p>
            <div>
              <label className="text-xs text-gray-500">Cv (Flow Coefficient)</label>
              <input type="number" step="0.01" value={calcVals[0]} onChange={e => { setCalcVals([e.target.value]); const v = parseFloat(e.target.value); setCalcResult(!isNaN(v) ? v * 3.1 * 0.001 * 60 : null) }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm mt-1" placeholder="Masukkan Cv..." />
            </div>
            {calcResult !== null && calcVals[0] !== '' && (
              <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm font-semibold text-teal-800">Result: {calcResult.toFixed(2)} SCFH</p>
                <p className="text-xs text-gray-500 mt-1">Standard Cubic Feet per Hour (seat leak rate)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
