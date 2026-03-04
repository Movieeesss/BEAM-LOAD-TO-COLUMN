import React, { useState } from 'react';

interface Beam {
  id: number;
  beamNo: string;
  length: string;
  slab1: string;
  slab2: string;
  pointLoad: string;
  overallDepth: string;
  effectiveDepth: string; // Calculated field
  sw: string;             // Calculated field
  hasBW: 'YES' | 'NO';
  bwThickInch: '9' | '4.5';
  hasOpening: 'YES' | 'NO';
  bwHeight: string;
}

const BeamToColumn: React.FC = () => {
  const [beams, setBeams] = useState<Beam[]>([
    { 
      id: 1, beamNo: 'A1-B1', length: '14', slab1: '19.07', slab2: '0', 
      pointLoad: '50', overallDepth: '600', effectiveDepth: '569', 
      sw: '3.45', hasBW: 'NO', bwThickInch: '9', hasOpening: 'NO', bwHeight: '4.57' 
    }
  ]);

  const CONCRETE_DENSITY = 25; // Y8
  const BRICK_DENSITY = 20;    // Y12
  const BEAM_WIDTH = 230;      // Y3
  const FACTOR = 1.5;         // Y23

  const calculate = (b: Beam) => {
    const L = parseFloat(b.length) || 0;
    const D = parseFloat(b.overallDepth) || 0;
    const SL1 = parseFloat(b.slab1) || 0;
    const SL2 = parseFloat(b.slab2) || 0;
    const PL = parseFloat(b.pointLoad) || 0;
    const BH = parseFloat(b.bwHeight) || 0;

    // 1. Effective Depth & SW (based on your Excel formula H3-($Y$18/2)-$Y$17)
    const effectiveD = D > 0 ? D - 31 : 0; 
    const swValue = (D / 1000) * (BEAM_WIDTH / 1000) * CONCRETE_DENSITY;

    // 2. Slab Load Column
    const totalSlab = SL1 + SL2;

    // 3. Brickwork Logic
    const bwThickM = b.hasBW === 'YES' ? (b.bwThickInch === '9' ? 0.23 : 0.12) : 0;
    let bwWeight = b.hasBW === 'YES' ? (bwThickM * BH * BRICK_DENSITY) : 0;
    if (b.hasOpening === 'YES') {
      bwWeight = bwWeight * 0.75; // 25% Reduction
    }

    // 4. Total Beam UDL (UNFAC)
    const udlUnfac = totalSlab + swValue + bwWeight + (L > 0 ? PL / L : 0);
    const udlFac = udlUnfac * FACTOR;

    // 5. Final Load to Column (UNFAC)
    const columnLoad = (udlUnfac * L) + PL;

    return {
      effD: effectiveD,
      sw: swValue.toFixed(3),
      totalSlab: totalSlab.toFixed(2),
      bwThickM: bwThickM.toFixed(2),
      bwWeight: bwWeight.toFixed(2),
      udlUnfac: udlUnfac.toFixed(2),
      udlFac: udlFac.toFixed(2),
      columnLoad: columnLoad.toFixed(2)
    };
  };

  const update = (id: number, field: keyof Beam, value: string) => {
    setBeams(beams.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const addRow = () => {
    const nextId = beams.length > 0 ? Math.max(...beams.map(b => b.id)) + 1 : 1;
    setBeams([...beams, { ...beams[0], id: nextId, beamNo: `B${nextId}` }]);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black p-2">
      <div className="bg-slate-900 text-white p-4 mb-2 flex justify-between items-center rounded shadow-lg">
        <h1 className="text-xl font-black uppercase tracking-tighter">Beam Load to Column</h1>
        <button onClick={addRow} className="bg-blue-600 hover:bg-blue-800 px-5 py-2 rounded font-black text-sm transition-all">+ ADD ROW</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400 bg-white shadow-2xl">
          <thead className="bg-slate-200 uppercase text-[10px] font-black text-center">
            <tr className="divide-x divide-slate-400 border-b-2 border-slate-500">
              <th className="p-2 border" rowSpan={2}>S.No</th>
              <th className="p-2 border" rowSpan={2}>Beam No</th>
              <th className="p-2 border" rowSpan={2}>Length (m)</th>
              <th className="p-2 border bg-cyan-100" colSpan={3}>Slab Load</th>
              <th className="p-2 border bg-orange-100" rowSpan={2}>Point Load (kN)</th>
              <th className="p-2 border bg-gray-100" colSpan={2}>Depth (mm)</th>
              <th className="p-2 border bg-yellow-100" rowSpan={2}>SW (kN/m)</th>
              <th className="p-2 border bg-green-100" colSpan={6}>Brickwork (B.W)</th>
              <th className="p-2 border bg-blue-100" colSpan={2}>Total Beam UDL</th>
              <th className="p-2 border bg-red-600 text-white" rowSpan={2}>Load to Column (Unfac)</th>
            </tr>
            <tr className="divide-x divide-slate-400 border-b-2 border-slate-500">
              <th className="p-1 border bg-cyan-50 text-[9px]">Slab 1</th>
              <th className="p-1 border bg-cyan-50 text-[9px]">Slab 2</th>
              <th className="p-1 border bg-cyan-200 text-[9px]">Total</th>
              <th className="p-1 border bg-gray-50 text-[9px]">Overall</th>
              <th className="p-1 border bg-gray-50 text-[9px]">Effective</th>
              <th className="p-1 border bg-green-50 text-[9px]">B.W</th>
              <th className="p-1 border bg-green-50 text-[9px]">Inches</th>
              <th className="p-1 border bg-green-50 text-[9px]">Open%</th>
              <th className="p-1 border bg-green-50 text-[9px]">Height</th>
              <th className="p-1 border bg-green-50 text-[9px]">Thick(m)</th>
              <th className="p-1 border bg-green-200 text-[9px]">Weight</th>
              <th className="p-1 border bg-blue-50 text-[9px]">Unfac</th>
              <th className="p-1 border bg-blue-200 text-[9px]">Fac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-bold text-center text-[12px]">
            {beams.map((b, i) => {
              const res = calculate(b);
              return (
                <tr key={b.id} className="divide-x divide-slate-300 hover:bg-slate-50">
                  <td className="p-1 bg-slate-50">{i + 1}</td>
                  <td className="p-1"><input value={b.beamNo} onChange={e => update(b.id, 'beamNo', e.target.value)} className="w-full text-center outline-none" /></td>
                  <td className="p-1"><input value={b.length} onChange={e => update(b.id, 'length', e.target.value)} className="w-full text-center outline-none" /></td>
                  <td className="p-1 bg-cyan-50"><input value={b.slab1} onChange={e => update(b.id, 'slab1', e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-cyan-50"><input value={b.slab2} onChange={e => update(b.id, 'slab2', e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-cyan-100">{res.totalSlab}</td>
                  <td className="p-1 bg-orange-50"><input value={b.pointLoad} onChange={e => update(b.id, 'pointLoad', e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-gray-50"><input value={b.overallDepth} onChange={e => update(b.id, 'overallDepth', e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-gray-50">{res.effD}</td>
                  <td className="p-1 bg-yellow-50">{res.sw}</td>
                  <td className="p-1 bg-green-50">
                    <select value={b.hasBW} onChange={e => update(b.id, 'hasBW', e.target.value as any)} className="w-full bg-transparent font-black">
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td className="p-1 bg-green-50">
                    <select value={b.bwThickInch} onChange={e => update(b.id, 'bwThickInch', e.target.value as any)} className="w-full bg-transparent">
                      <option value="9">9"</option>
                      <option value="4.5">4.5"</option>
                    </select>
                  </td>
                  <td className="p-1 bg-green-50">
                    <select value={b.hasOpening} onChange={e => update(b.id, 'hasOpening', e.target.value as any)} className="w-full bg-transparent">
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td className="p-1 bg-green-50"><input value={b.bwHeight} onChange={e => update(b.id, 'bwHeight', e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-green-50">{res.bwThickM}</td>
                  <td className="p-1 bg-green-100">{res.bwWeight}</td>
                  <td className="p-1 bg-blue-50">{res.udlUnfac}</td>
                  <td className="p-1 bg-blue-100">{res.udlFac}</td>
                  <td className="p-1 bg-orange-600 text-white font-black text-sm">{res.columnLoad}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BeamToColumn;
