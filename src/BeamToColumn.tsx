import React, { useState } from 'react';

interface Beam {
  id: number;
  beamNo: string;
  length: string;
  slab1: string;
  slab2: string;
  pointLoad: string;
  overallDepth: string;
  width: string; // Typically 230mm from your Excel Y3
  hasBW: 'YES' | 'NO';
  bwThickInch: '9' | '4.5';
  hasOpening: 'YES' | 'NO';
  bwHeight: string;
}

const BeamToColumn: React.FC = () => {
  const [beams, setBeams] = useState<Beam[]>([
    { id: 1, beamNo: 'A1-B1', length: '14', slab1: '19.07', slab2: '0', pointLoad: '50', overallDepth: '600', width: '230', hasBW: 'NO', bwThickInch: '9', hasOpening: 'NO', bwHeight: '4.57' }
  ]);

  const CONCRETE_DENSITY = 25; // From Excel Y8
  const BRICK_DENSITY = 20;    // From Excel Y12
  const FACTOR = 1.5;         // From Excel Y23

  const calculate = (b: Beam) => {
    const L = parseFloat(b.length) || 0;
    const D = parseFloat(b.overallDepth) || 0;
    const W = parseFloat(b.width) || 0;
    const SL1 = parseFloat(b.slab1) || 0;
    const SL2 = parseFloat(b.slab2) || 0;
    const PL = parseFloat(b.pointLoad) || 0;
    const BH = parseFloat(b.bwHeight) || 0;

    // Self Weight = (Overall Depth/1000) * (Width/1000) * 25
    const sw = (D / 1000) * (W / 1000) * CONCRETE_DENSITY;

    // B.W Thickness conversion from Inch to Meter
    const bwThickM = b.bwThickInch === '9' ? 0.23 : 0.12;
    
    // Brickwork Weight Calculation with Opening reduction logic
    let bwWeight = 0;
    if (b.hasBW === 'YES') {
      bwWeight = bwThickM * BH * BRICK_DENSITY;
      if (b.hasOpening === 'YES') {
        bwWeight = bwWeight * 0.75; // Applies 25% reduction
      }
    }

    // Total Beam UDL (Unfactored)
    const totalSlab = SL1 + SL2;
    const udlUnfac = totalSlab + sw + bwWeight + (L > 0 ? PL / L : 0);
    const udlFac = udlUnfac * FACTOR;

    // Final Beam Load to Column (Unfactored)
    const columnLoad = (udlUnfac * L) + PL;

    return {
      sw: sw.toFixed(3),
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

  const removeRow = (id: number) => setBeams(beams.filter(b => b.id !== id));

  return (
    <div className="min-h-screen bg-white font-sans text-black p-4">
      <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b-4 border-blue-600 rounded-t shadow-lg">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Beam Load to Column Accumulator</h1>
        <button onClick={addRow} className="bg-blue-600 hover:bg-blue-800 px-6 py-2 rounded font-black transition-all">+ ADD NEW BEAM</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-400 bg-white shadow-2xl">
          <thead className="bg-slate-200 uppercase text-[11px] font-black text-center">
            <tr className="divide-x divide-slate-400 border-b-2 border-slate-500">
              <th className="p-3">S.No</th>
              <th className="p-3">Beam No</th>
              <th className="p-3">Length(m)</th>
              <th className="p-3 bg-yellow-100">Slab Load (kN/m)</th>
              <th className="p-3">Depth(mm)</th>
              <th className="p-3 bg-blue-100">B.W</th>
              <th className="p-3 bg-blue-100">Thick (in)</th>
              <th className="p-3 bg-blue-100">Opening (25%)</th>
              <th className="p-3">B.W Height(m)</th>
              <th className="p-3 bg-green-100">Total UDL (Fac)</th>
              <th className="p-3 bg-orange-600 text-white">Load to Column (kN)</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-bold text-center text-[13px]">
            {beams.map((b, i) => {
              const res = calculate(b);
              return (
                <tr key={b.id} className="divide-x divide-slate-300 hover:bg-slate-50">
                  <td className="p-2 bg-slate-50">{i + 1}</td>
                  <td className="p-1"><input value={b.beamNo} onChange={e => update(b.id, 'beamNo', e.target.value)} className="w-full text-center p-2 outline-none" /></td>
                  <td className="p-1"><input value={b.length} onChange={e => update(b.id, 'length', e.target.value)} className="w-full text-center p-2 outline-none" /></td>
                  <td className="p-1 bg-yellow-50"><input value={b.slab1} onChange={e => update(b.id, 'slab1', e.target.value)} className="w-full text-center p-2 bg-transparent outline-none" /></td>
                  <td className="p-1"><input value={b.overallDepth} onChange={e => update(b.id, 'overallDepth', e.target.value)} className="w-full text-center p-2 outline-none" /></td>
                  <td className="p-1 bg-blue-50">
                    <select value={b.hasBW} onChange={e => update(b.id, 'hasBW', e.target.value)} className="w-full p-2 bg-transparent font-black cursor-pointer">
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td className="p-1 bg-blue-50">
                    <select value={b.bwThickInch} onChange={e => update(b.id, 'bwThickInch', e.target.value)} className="w-full p-2 bg-transparent font-black cursor-pointer">
                      <option value="9">9"</option>
                      <option value="4.5">4.5"</option>
                    </select>
                  </td>
                  <td className="p-1 bg-blue-50">
                    <select value={b.hasOpening} onChange={e => update(b.id, 'hasOpening', e.target.value)} className="w-full p-2 bg-transparent font-black cursor-pointer">
                      <option value="YES">YES</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td className="p-1"><input value={b.bwHeight} onChange={e => update(b.id, 'bwHeight', e.target.value)} className="w-full text-center p-2 outline-none" /></td>
                  <td className="p-2 bg-green-50 text-green-900 font-black">{res.udlFac}</td>
                  <td className="p-2 bg-orange-100 text-orange-900 text-lg font-black">{res.columnLoad}</td>
                  <td className="p-1"><button onClick={() => removeRow(b.id)} className="bg-red-500 text-white px-3 py-1 rounded font-black hover:bg-red-700">DEL</button></td>
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