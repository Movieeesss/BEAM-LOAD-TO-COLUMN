import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Beam {
  id: number;
  beamNo: string;
  length: string;
  slab1: string;
  slab2: string;
  pointLoad: string;
  overallDepth: string;
  hasBW: 'YES' | 'NO';
  bwThickInch: '9' | '4.5';
  hasOpening: 'YES' | 'NO';
  bwHeight: string;
}

const BeamToColumn: React.FC = () => {
  const [beams, setBeams] = useState<Beam[]>([
    { 
      id: 1, beamNo: 'A1-B1', length: '4', slab1: '19.07', slab2: '10', 
      pointLoad: '45', overallDepth: '355', hasBW: 'YES', 
      bwThickInch: '9', hasOpening: 'NO', bwHeight: '3.05' 
    }
  ]);

  const CONCRETE_DENSITY = 25; 
  const BRICK_DENSITY = 20;    
  const BEAM_WIDTH = 230;      
  const LOAD_FACTOR = 1.5;     

  const calculate = (b: Beam) => {
    const C3 = parseFloat(b.length) || 0;
    const H3 = parseFloat(b.overallDepth) || 0;
    const D3 = parseFloat(b.slab1) || 0;
    const E3 = parseFloat(b.slab2) || 0;
    const G3 = parseFloat(b.pointLoad) || 0;
    const N3 = parseFloat(b.bwHeight) || 0;

    // F3: TOTAL SLAB LOAD
    const F3 = D3 + E3;

    // J3: SELF WEIGHT
    const J3 = (H3 / 1000) * (BEAM_WIDTH / 1000) * CONCRETE_DENSITY;

    // P3: B.W WEIGHT
    const thicknessM = b.hasBW === 'YES' ? (b.bwThickInch === '9' ? 0.23 : 0.12) : 0;
    let P3 = b.hasBW === 'YES' ? (thicknessM * N3 * BRICK_DENSITY) : 0;
    if (b.hasOpening === 'YES') P3 *= 0.75;

    // Q3: TOTAL BEAM UDL (UNFAC) = F3 + J3 + P3
    const Q3 = F3 + J3 + P3;
    
    // S3: TOTAL BEAM UDL (FAC) = Q3 * 1.5
    const S3 = Q3 * LOAD_FACTOR;

    // R3: SECONDARY BEAM LOAD (HALF) = G3 / 2
    const R3 = G3 / 2;

    // V3: BEAM LOAD TO COLUMN (UNFAC) = (Q3 * C3) + R3
    const V3 = (Q3 * C3) + R3;

    return {
      f3: F3.toFixed(2),
      j3: J3.toFixed(5),
      p3: P3.toFixed(4),
      q3: Q3.toFixed(2), // Matches 45.14
      s3: S3.toFixed(2), // Matches 67.71
      r3: R3.toFixed(2), // Matches 22.50
      v3: V3.toFixed(2)  // Matches 203.07
    };
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a3');
    doc.setFontSize(16);
    doc.text("FINAL BEAM LOAD TO COLUMN REPORT", 14, 15);
    const rows = beams.map((b, i) => {
      const res = calculate(b);
      return [i + 1, b.beamNo, b.length, res.f3, b.pointLoad, b.overallDepth, res.j3, b.hasBW, b.bwHeight, res.p3, res.q3, res.s3, res.v3];
    });
    autoTable(doc, {
      startY: 22,
      head: [['S.No', 'Beam No', 'Length', 'Slab Load', 'Point Load', 'Depth', 'SW', 'B.W', 'BW Height', 'BW Weight', 'UDL (Unfac)', 'UDL (Fac)', 'Load to Col']],
      body: rows,
      styles: { fontSize: 8, halign: 'center' }
    });
    doc.save('Final_Beam_Calculation.pdf');
  };

  const update = (id: number, field: keyof Beam, value: string) => {
    setBeams(beams.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  return (
    <div className="min-h-screen bg-white text-[11px] font-bold text-black p-4">
      <div className="bg-slate-900 text-white p-4 mb-4 flex justify-between items-center rounded-lg shadow-xl">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Beam Load To Column</h1>
        <div className="flex gap-4">
          <button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-black uppercase shadow-md">Download PDF</button>
          <button onClick={() => setBeams([...beams, { ...beams[0], id: Date.now(), beamNo: `B${beams.length + 1}` }])} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-black uppercase shadow-md">+ Add Beam</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-300 shadow-2xl">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 uppercase font-black text-center border-b-2 border-slate-500">
            <tr className="divide-x divide-slate-400">
              <th className="p-2 border" rowSpan={2}>S.No</th>
              <th className="p-2 border" rowSpan={2}>Beam No</th>
              <th className="p-2 border" rowSpan={2}>Len(m)</th>
              <th className="p-2 border bg-cyan-100" colSpan={3}>Slab Load</th>
              <th className="p-2 border bg-orange-100" rowSpan={2}>Point Load</th>
              <th className="p-2 border" rowSpan={2}>Depth(mm)</th>
              <th className="p-2 border bg-yellow-100" rowSpan={2}>SW</th>
              <th className="p-2 border bg-green-100" colSpan={5}>Brickwork</th>
              <th className="p-2 border bg-blue-100" colSpan={3}>Total Beam UDL</th>
              <th className="p-2 border bg-red-600 text-white" rowSpan={2}>Load to Column</th>
              <th className="p-2 border" rowSpan={2}>Action</th>
            </tr>
            <tr className="divide-x divide-slate-400 text-[9px] border-b border-slate-400">
              <th className="p-1">S1</th><th className="p-1">S2</th><th className="p-1 bg-cyan-200">Total</th>
              <th className="p-1">B.W</th><th className="p-1">Inch</th><th className="p-1">Open%</th><th className="p-1">H</th><th className="p-1 bg-green-200">Weight</th>
              <th className="p-1 bg-blue-50">Unfac</th><th className="p-1">Sec.L</th><th className="p-1 bg-blue-200">Fac</th>
            </tr>
          </thead>
          <tbody className="text-center divide-y divide-slate-200">
            {beams.map((b, i) => {
              const res = calculate(b);
              return (
                <tr key={b.id} className="divide-x divide-slate-200 hover:bg-slate-50 transition-all">
                  <td className="p-2 bg-slate-50">{i + 1}</td>
                  <td className="p-1"><input value={b.beamNo} onChange={e => update(b.id, 'beamNo', e.target.value)} className="w-16 text-center outline-none" /></td>
                  <td className="p-1"><input value={b.length} onChange={e => update(b.id, 'length', e.target.value)} className="w-10 text-center outline-none" /></td>
                  <td className="p-1"><input value={b.slab1} onChange={e => update(b.id, 'slab1', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1"><input value={b.slab2} onChange={e => update(b.id, 'slab2', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1 bg-cyan-100 font-black">{res.f3}</td>
                  <td className="p-1 bg-orange-50"><input value={b.pointLoad} onChange={e => update(b.id, 'pointLoad', e.target.value)} className="w-12 text-center bg-transparent outline-none" /></td>
                  <td className="p-1"><input value={b.overallDepth} onChange={e => update(b.id, 'overallDepth', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1 bg-yellow-50">{res.j3}</td>
                  <td className="p-1"><select value={b.hasBW} onChange={e => update(b.id, 'hasBW', e.target.value as any)} className="bg-transparent"><option value="YES">YES</option><option value="NO">NO</option></select></td>
                  <td className="p-1"><select value={b.bwThickInch} onChange={e => update(b.id, 'bwThickInch', e.target.value as any)} className="bg-transparent"><option value="9">9"</option><option value="4.5">4.5"</option></select></td>
                  <td className="p-1"><select value={b.hasOpening} onChange={e => update(b.id, 'hasOpening', e.target.value as any)} className="bg-transparent"><option value="YES">YES</option><option value="NO">NO</option></select></td>
                  <td className="p-1"><input value={b.bwHeight} onChange={e => update(b.id, 'bwHeight', e.target.value)} className="w-10 text-center outline-none" /></td>
                  <td className="p-1 bg-green-100">{res.p3}</td>
                  <td className="p-1 bg-blue-50 font-black text-blue-800">{res.q3}</td>
                  <td className="p-1 bg-blue-50 text-slate-500">{res.r3}</td>
                  <td className="p-1 bg-blue-200 font-black">{res.s3}</td>
                  <td className="p-1 bg-red-600 text-white font-black text-sm">{res.v3}</td>
                  <td className="p-1"><button onClick={() => setBeams(beams.filter(x => x.id !== b.id))} className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition-all">DEL</button></td>
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
