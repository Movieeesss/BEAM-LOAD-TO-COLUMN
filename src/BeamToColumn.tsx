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

  const CONCRETE_DENSITY = 25; // Y8
  const BRICK_DENSITY = 20;    // Y12
  const BEAM_WIDTH = 230;      // Y3
  const FACTOR = 1.5;          // Y23

  const calculate = (b: Beam) => {
    const L = parseFloat(b.length) || 0;
    const D = parseFloat(b.overallDepth) || 0;
    const SL1 = parseFloat(b.slab1) || 0;
    const SL2 = parseFloat(b.slab2) || 0;
    const PL = parseFloat(b.pointLoad) || 0;
    const BH = parseFloat(b.bwHeight) || 0;

    const effectiveD = D > 0 ? D - 31 : 0; 
    const sw = (D / 1000) * (BEAM_WIDTH / 1000) * CONCRETE_DENSITY;
    const totalSlab = SL1 + SL2;

    const bwThickM = b.hasBW === 'YES' ? (b.bwThickInch === '9' ? 0.23 : 0.12) : 0;
    let bwWeight = b.hasBW === 'YES' ? (bwThickM * BH * BRICK_DENSITY) : 0;
    if (b.hasOpening === 'YES') bwWeight *= 0.75;

    const udlUnfac = totalSlab + sw + bwWeight + (L > 0 ? PL / L : 0);
    const secondaryLoad = PL / 2;
    const udlFac = udlUnfac * FACTOR;
    const secondaryFac = secondaryLoad * FACTOR;
    
    // Formula from Column V: (Q3 * C3) + R3
    const columnLoad = (udlUnfac * L) + secondaryLoad;

    return {
      effD: effectiveD,
      sw: sw.toFixed(3),
      totalSlab: totalSlab.toFixed(2),
      bwThickM: bwThickM.toFixed(2),
      bwWeight: bwWeight.toFixed(2),
      udlUnfac: udlUnfac.toFixed(2),
      secLoad: secondaryLoad.toFixed(2),
      udlFac: udlFac.toFixed(2),
      secFac: secondaryFac.toFixed(2),
      columnLoad: columnLoad.toFixed(2)
    };
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a3'); // A3 Landscape for many columns
    doc.text("BEAM LOAD TO COLUMN REPORT", 14, 15);
    const rows = beams.map((b, i) => {
      const res = calculate(b);
      return [i+1, b.beamNo, b.length, b.slab1, b.slab2, res.totalSlab, b.pointLoad, b.overallDepth, res.effD, res.sw, b.hasBW, b.bwThickInch, b.hasOpening, b.bwHeight, res.bwWeight, res.udlUnfac, res.secLoad, res.udlFac, res.columnLoad];
    });
    autoTable(doc, {
      startY: 20,
      head: [['S.No', 'Beam', 'Len', 'S1', 'S2', 'Total Slab', 'Point', 'Depth', 'Eff.D', 'SW', 'B.W', 'Inch', 'Open', 'H', 'BW.Wt', 'UDL Unfac', 'Sec.Load', 'UDL Fac', 'Load to Col']],
      body: rows,
      styles: { fontSize: 7 }
    });
    doc.save('Beam_Load_Report.pdf');
  };

  const update = (id: number, field: keyof Beam, value: string) => {
    setBeams(beams.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  return (
    <div className="min-h-screen bg-white text-[11px] font-bold p-2">
      <div className="bg-slate-900 text-white p-3 mb-2 flex justify-between items-center rounded">
        <h1 className="text-xl font-black uppercase tracking-tight">Beam Load To Column</h1>
        <div className="flex gap-2">
          <button onClick={downloadPDF} className="bg-green-600 px-4 py-2 rounded text-xs">DOWNLOAD PDF</button>
          <button onClick={() => setBeams([...beams, { ...beams[0], id: Date.now(), beamNo: `B${beams.length + 1}` }])} className="bg-blue-600 px-4 py-2 rounded text-xs">+ ADD ROW</button>
        </div>
      </div>

      <div className="overflow-x-auto shadow-2xl">
        <table className="w-full border-collapse border border-slate-400">
          <thead className="bg-slate-200 uppercase font-black text-center divide-y divide-slate-400">
            <tr className="divide-x divide-slate-400">
              <th className="p-1 border" rowSpan={2}>S.No</th>
              <th className="p-1 border" rowSpan={2}>Beam No</th>
              <th className="p-1 border" rowSpan={2}>Length</th>
              <th className="p-1 border bg-cyan-100" colSpan={3}>Slab Load (kN/m)</th>
              <th className="p-1 border bg-orange-100" rowSpan={2}>Point Load</th>
              <th className="p-1 border bg-gray-100" colSpan={2}>Depth (mm)</th>
              <th className="p-1 border bg-yellow-100" rowSpan={2}>SW</th>
              <th className="p-1 border bg-green-100" colSpan={6}>Brickwork (B.W)</th>
              <th className="p-1 border bg-blue-100" colSpan={4}>Total Beam UDL (kN/m)</th>
              <th className="p-1 border bg-red-600 text-white" rowSpan={2}>Load to Column</th>
              <th className="p-1 border" rowSpan={2}>Action</th>
            </tr>
            <tr className="divide-x divide-slate-400 text-[9px]">
              <th className="p-1 bg-cyan-50">S1</th><th className="p-1 bg-cyan-50">S2</th><th className="p-1 bg-cyan-200">Total</th>
              <th className="p-1 bg-gray-50">Over</th><th className="p-1 bg-gray-50">Eff</th>
              <th className="p-1 bg-green-50">B.W</th><th className="p-1 bg-green-50">Inch</th><th className="p-1 bg-green-50">Open%</th><th className="p-1 bg-green-50">H</th><th className="p-1 bg-green-50">M</th><th className="p-1 bg-green-200">Weight</th>
              <th className="p-1 bg-blue-50">Unfac</th><th className="p-1 bg-blue-50">Sec.L</th><th className="p-1 bg-blue-200">Fac</th><th className="p-1 bg-blue-200">Sec.F</th>
            </tr>
          </thead>
          <tbody className="text-center divide-y divide-slate-300">
            {beams.map((b, i) => {
              const res = calculate(b);
              return (
                <tr key={b.id} className="divide-x divide-slate-300 hover:bg-slate-50">
                  <td className="p-1 bg-slate-100">{i + 1}</td>
                  <td className="p-1"><input value={b.beamNo} onChange={e => update(b.id, 'beamNo', e.target.value)} className="w-16 text-center outline-none" /></td>
                  <td className="p-1"><input value={b.length} onChange={e => update(b.id, 'length', e.target.value)} className="w-12 text-center outline-none" /></td>
                  <td className="p-1 bg-cyan-50"><input value={b.slab1} onChange={e => update(b.id, 'slab1', e.target.value)} className="w-14 text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-cyan-50"><input value={b.slab2} onChange={e => update(b.id, 'slab2', e.target.value)} className="w-14 text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-cyan-100">{res.totalSlab}</td>
                  <td className="p-1 bg-orange-50"><input value={b.pointLoad} onChange={e => update(b.id, 'pointLoad', e.target.value)} className="w-14 text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-gray-50"><input value={b.overallDepth} onChange={e => update(b.id, 'overallDepth', e.target.value)} className="w-14 text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-gray-50">{res.effD}</td>
                  <td className="p-1 bg-yellow-50">{res.sw}</td>
                  <td className="p-1 bg-green-50"><select value={b.hasBW} onChange={e => update(b.id, 'hasBW', e.target.value as any)} className="bg-transparent"><option value="YES">YES</option><option value="NO">NO</option></select></td>
                  <td className="p-1 bg-green-50"><select value={b.bwThickInch} onChange={e => update(b.id, 'bwThickInch', e.target.value as any)} className="bg-transparent"><option value="9">9"</option><option value="4.5">4.5"</option></select></td>
                  <td className="p-1 bg-green-50"><select value={b.hasOpening} onChange={e => update(b.id, 'hasOpening', e.target.value as any)} className="bg-transparent"><option value="YES">YES</option><option value="NO">NO</option></select></td>
                  <td className="p-1 bg-green-50"><input value={b.bwHeight} onChange={e => update(b.id, 'bwHeight', e.target.value)} className="w-12 text-center bg-transparent outline-none" /></td>
                  <td className="p-1 bg-green-50">{res.bwThickM}</td>
                  <td className="p-1 bg-green-100">{res.bwWeight}</td>
                  <td className="p-1 bg-blue-50">{res.udlUnfac}</td>
                  <td className="p-1 bg-blue-50">{res.secLoad}</td>
                  <td className="p-1 bg-blue-200">{res.udlFac}</td>
                  <td className="p-1 bg-blue-200">{res.secFac}</td>
                  <td className="p-1 bg-red-600 text-white font-black">{res.columnLoad}</td>
                  <td className="p-1"><button onClick={() => setBeams(beams.filter(x => x.id !== b.id))} className="text-red-600 px-2">DEL</button></td>
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
