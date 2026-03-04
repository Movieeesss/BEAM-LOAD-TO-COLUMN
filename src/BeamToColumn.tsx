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

    const F3 = D3 + E3;
    const J3 = (H3 / 1000) * (BEAM_WIDTH / 1000) * CONCRETE_DENSITY;
    const thicknessM = b.hasBW === 'YES' ? (b.bwThickInch === '9' ? 0.23 : 0.12) : 0;
    let P3 = b.hasBW === 'YES' ? (thicknessM * N3 * BRICK_DENSITY) : 0;
    if (b.hasOpening === 'YES') P3 *= 0.75;

    // Q3: UDL UNFAC
    const Q3 = F3 + J3 + P3;
    // R3: SEC UNFAC
    const R3 = G3 / 2;
    // S3: UDL FAC
    const S3 = Q3 * LOAD_FACTOR;
    // T3: SEC FAC (The missing calculation)
    const T3 = R3 * LOAD_FACTOR;
    // V3: LOAD TO COLUMN
    const V3 = (Q3 * C3) + R3;

    return {
      f3: F3.toFixed(2),
      j3: J3.toFixed(5),
      p3: P3.toFixed(4),
      q3: Q3.toFixed(2),
      r3: R3.toFixed(2),
      s3: S3.toFixed(2),
      t3: T3.toFixed(2),
      v3: V3.toFixed(2)
    };
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a3');
    doc.setFontSize(14);
    doc.text("BEAM LOAD TO COLUMN CALCULATION REPORT", 14, 15);
    const rows = beams.map((b, i) => {
      const res = calculate(b);
      return [i + 1, b.beamNo, b.length, res.f3, b.pointLoad, b.overallDepth, res.j3, b.hasBW, b.bwHeight, res.p3, res.q3, res.r3, res.s3, res.t3, res.v3];
    });
    autoTable(doc, {
      startY: 22,
      head: [['S.No', 'Beam No', 'Beam Length', 'Slab Load', 'Point Load', 'Depth', 'SW', 'B.W', 'BW Height', 'BW Weight', 'UDL (Unfac)', 'Sec (Unfac)', 'UDL (Fac)', 'Sec (Fac)', 'Load to Col']],
      body: rows,
      styles: { fontSize: 7, halign: 'center' }
    });
    doc.save('Final_Beam_Report.pdf');
  };

  const update = (id: number, field: keyof Beam, value: string) => {
    setBeams(beams.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  return (
    <div className="min-h-screen bg-white text-[10px] font-bold text-black p-2">
      <div className="bg-slate-900 text-white p-3 mb-2 flex justify-between items-center rounded shadow-lg">
        <h1 className="text-xl font-black uppercase tracking-tighter">Beam Load To Column</h1>
        <div className="flex gap-2">
          <button onClick={downloadPDF} className="bg-green-600 px-4 py-2 rounded font-black text-[9px]">DOWNLOAD PDF</button>
          <button onClick={() => setBeams([...beams, { ...beams[0], id: Date.now(), beamNo: `B${beams.length + 1}` }])} className="bg-blue-600 px-4 py-2 rounded font-black text-[9px]">+ ADD BEAM</button>
        </div>
      </div>

      <div className="overflow-x-auto shadow-xl">
        <table className="w-full border-collapse border border-slate-400">
          <thead className="bg-slate-100 uppercase font-black text-center">
            <tr className="divide-x divide-slate-400 border-b-2 border-slate-500">
              <th className="p-1 border" rowSpan={2}>S.No</th>
              <th className="p-1 border" rowSpan={2}>Beam No</th>
              <th className="p-1 border" rowSpan={2}>Beam Length (m)</th>
              <th className="p-1 border bg-cyan-100" colSpan={3}>Slab Load</th>
              <th className="p-1 border bg-orange-100" rowSpan={2}>Point Load</th>
              <th className="p-1 border" colSpan={2}>Depth</th>
              <th className="p-1 border bg-yellow-100" rowSpan={2}>SW</th>
              <th className="p-1 border bg-green-100" colSpan={5}>Brickwork</th>
              <th className="p-1 border bg-blue-100" colSpan={4}>Total Beam UDL</th>
              <th className="p-1 border bg-red-600 text-white" rowSpan={2}>Load to Column</th>
              <th className="p-1 border" rowSpan={2}>DEL</th>
            </tr>
            <tr className="divide-x divide-slate-400 text-[8px] border-b border-slate-400">
              <th className="p-1">S1</th><th className="p-1">S2</th><th className="p-1 bg-cyan-200">Total</th>
              <th className="p-1">Over</th><th className="p-1">Eff</th>
              <th className="p-1">B.W</th><th className="p-1">Inch</th><th className="p-1">Open%</th><th className="p-1">H</th><th className="p-1 bg-green-200">Weight</th>
              <th className="p-1 bg-blue-50">Unfac</th><th className="p-1">Sec.U</th><th className="p-1 bg-blue-200">Fac</th><th className="p-1 bg-blue-200">Sec.F</th>
            </tr>
          </thead>
          <tbody className="text-center divide-y divide-slate-300">
            {beams.map((b, i) => {
              const res = calculate(b);
              return (
                <tr key={b.id} className="divide-x divide-slate-300 hover:bg-slate-50">
                  <td className="p-1 bg-slate-50">{i + 1}</td>
                  <td className="p-1"><input value={b.beamNo} onChange={e => update(b.id, 'beamNo', e.target.value)} className="w-16 text-center outline-none" /></td>
                  <td className="p-1"><input value={b.length} onChange={e => update(b.id, 'length', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1"><input value={b.slab1} onChange={e => update(b.id, 'slab1', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1"><input value={b.slab2} onChange={e => update(b.id, 'slab2', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1 bg-cyan-100">{res.f3}</td>
                  <td className="p-1 bg-orange-50"><input value={b.pointLoad} onChange={e => update(b.id, 'pointLoad', e.target.value)} className="w-12 text-center bg-transparent outline-none" /></td>
                  <td className="p-1"><input value={b.overallDepth} onChange={e => update(b.id, 'overallDepth', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1 text-[8px]">{parseFloat(b.overallDepth) - 31}</td>
                  <td className="p-1 bg-yellow-50">{res.j3}</td>
                  <td className="p-1"><select value={b.hasBW} onChange={e => update(b.id, 'hasBW', e.target.value as any)} className="bg-transparent"><option value="YES">YES</option><option value="NO">NO</option></select></td>
                  <td className="p-1"><select value={b.bwThickInch} onChange={e => update(b.id, 'bwThickInch', e.target.value as any)} className="bg-transparent"><option value="9">9"</option><option value="4.5">4.5"</option></select></td>
                  <td className="p-1"><select value={b.hasOpening} onChange={e => update(b.id, 'hasOpening', e.target.value as any)} className="bg-transparent"><option value="YES">YES</option><option value="NO">NO</option></select></td>
                  <td className="p-1"><input value={b.bwHeight} onChange={e => update(b.id, 'bwHeight', e.target.value)} className="w-10 text-center outline-none" /></td>
                  <td className="p-1 bg-green-100">{res.p3}</td>
                  <td className="p-1 bg-blue-50 font-black">{res.q3}</td>
                  <td className="p-1 bg-blue-50 text-slate-400">{res.r3}</td>
                  <td className="p-1 bg-blue-200 font-black">{res.s3}</td>
                  <td className="p-1 bg-blue-200 font-black">{res.t3}</td>
                  <td className="p-1 bg-red-600 text-white font-black text-xs">{res.v3}</td>
                  <td className="p-1"><button onClick={() => setBeams(beams.filter(x => x.id !== b.id))} className="text-red-600 font-black">DEL</button></td>
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
