import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as d3 from 'd3';
import { api } from '../services/api';
import DataQualityBadge from '../components/DataQualityBadge';

const STATUS_COLOR = {
  current:             '#63b3ed',
  predicted:           '#b794f4',
  intervention_window: '#68d391',
  avoidable:           '#fc8181',
};

export default function CascadeGraph() {
  const { id } = useParams();
  const svgRef    = useRef(null);
  const [dag, setDag]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null); // { x, y, node }

  useEffect(() => {
    api.getCascade(id)
      .then(d => { setDag(d); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  // ── ResizeObserver draw — fixes SVG width=0 on first render ─────────────
  useEffect(() => {
    if (!dag || !svgRef.current) return;
    const el = svgRef.current;
    let af;
    const draw = () => { af = requestAnimationFrame(() => renderDAG(dag, el)); };
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    draw();
    return () => { ro.disconnect(); cancelAnimationFrame(af); };
  }, [dag]);

  function renderDAG(dag, svgEl) {
    const W = svgEl.clientWidth || 700;
    const H = 420;
    const nodeW = 186, nodeH = 66;

    d3.select(svgEl).selectAll('*').remove();

    const svg = d3.select(svgEl)
      .attr('width', W).attr('height', H)
      .style('overflow', 'visible');

    const nodes = [...dag.nodes].sort((a, b) => a.day - b.day);
    const n = nodes.length;

    nodes.forEach((node, i) => {
      node._x = W / 2;
      node._y = 40 + i * ((H - 80) / Math.max(n - 1, 1));
    });

    // Edges
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      svg.append('line')
        .attr('x1', a._x).attr('y1', a._y + nodeH / 2)
        .attr('x2', b._x).attr('y2', b._y - nodeH / 2)
        .attr('stroke', 'rgba(99,179,237,0.2)').attr('stroke-width', 2)
        .attr('stroke-dasharray', b.status === 'avoidable' ? '5,5' : '0');
    }

    // Nodes
    const nodeGroup = svg.selectAll('g.node')
      .data(nodes).enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d._x - nodeW / 2}, ${d._y - nodeH / 2})`)
      .style('opacity', 0)
      .style('cursor', 'pointer');

    nodeGroup.transition().duration(400).delay((d, i) => i * 280).style('opacity', 1);

    // Hover tooltip via React state
    nodeGroup
      .on('mouseenter', function(event, d) {
        const rect = svgEl.getBoundingClientRect();
        const containerRect = svgEl.parentElement.getBoundingClientRect();
        setTooltip({
          x: event.clientX - containerRect.left + 12,
          y: event.clientY - containerRect.top - 10,
          node: d,
        });
      })
      .on('mouseleave', () => setTooltip(null));

    // Node bg
    nodeGroup.append('rect')
      .attr('width', nodeW).attr('height', nodeH).attr('rx', 12)
      .attr('fill', d => `${STATUS_COLOR[d.status]}18`)
      .attr('stroke', d => STATUS_COLOR[d.status])
      .attr('stroke-width', d => d.status === 'intervention_window' ? 2.5 : 1.5)
      .style('filter', d => d.status === 'intervention_window'
        ? `drop-shadow(0 0 12px ${STATUS_COLOR[d.status]}80)` : 'none');

    // Pulse ring for intervention window
    nodeGroup.filter(d => d.status === 'intervention_window')
      .append('rect')
      .attr('width', nodeW).attr('height', nodeH).attr('rx', 12)
      .attr('fill', 'none').attr('stroke', STATUS_COLOR.intervention_window)
      .attr('stroke-width', 2).attr('opacity', 0.5)
      .call(el => {
        const pulse = () => el.attr('opacity', 0.5).transition().duration(900).attr('opacity', 0).on('end', pulse);
        pulse();
      });

    // Day label
    nodeGroup.append('text')
      .attr('x', 10).attr('y', 18)
      .attr('fill', d => STATUS_COLOR[d.status])
      .attr('font-size', '10px').attr('font-weight', '600').attr('font-family', 'Inter')
      .text(d => `Day ${d.day}`);

    // Event label
    nodeGroup.append('text')
      .attr('x', 10).attr('y', 36)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px').attr('font-weight', '700').attr('font-family', 'Inter')
      .text(d => d.event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 24));

    // Probability / label
    nodeGroup.append('text')
      .attr('x', 10).attr('y', 54)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px').attr('font-family', 'Inter')
      .text(d => d.intervention_label || `${(d.probability * 100).toFixed(0)}% probability`);
  }

  return (
    <div className="fade-in" style={{ position: 'relative' }}>
      <h1 className="page-title">Complication Cascade Graph</h1>
      <p className="page-sub">
        Patient #{id} · Forward-simulated causal DAG ·{' '}
        <span style={{ color: 'var(--accent-green)' }}>● Green = Intervention Window</span>
      </p>

      {dag && <DataQualityBadge quality={dag.data_quality} />}

      {dag && (
        <div className="card" style={{ marginBottom: 16, position: 'relative' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            {Object.entries(STATUS_COLOR).map(([status, color]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                  {status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
          <svg ref={svgRef} style={{ width: '100%', height: 420, display: 'block' }} />

          {/* Node tooltip */}
          {tooltip && (
            <div style={{
              position: 'absolute',
              left: tooltip.x, top: tooltip.y,
              background: 'rgba(8,12,22,0.97)',
              border: `1px solid ${STATUS_COLOR[tooltip.node.status]}40`,
              borderRadius: 10, padding: '10px 14px',
              fontSize: '0.78rem', color: '#e2e8f0',
              pointerEvents: 'none', zIndex: 10, maxWidth: 240,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <div style={{ fontWeight: 700, color: STATUS_COLOR[tooltip.node.status], marginBottom: 4 }}>
                Day {tooltip.node.day} — {tooltip.node.event.replace(/_/g, ' ')}
              </div>
              <div>Probability: <strong>{(tooltip.node.probability * 100).toFixed(0)}%</strong></div>
              <div style={{ color: '#94a3b8', textTransform: 'capitalize', marginTop: 2 }}>
                {tooltip.node.status.replace(/_/g, ' ')}
              </div>
              {tooltip.node.intervention_label && (
                <div style={{ marginTop: 4, color: '#68d391' }}>{tooltip.node.intervention_label}</div>
              )}
            </div>
          )}
        </div>
      )}

      {dag && (
        <div className="card" style={{ borderColor: 'rgba(104,211,145,0.3)', background: 'rgba(104,211,145,0.04)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: 4 }}>
                Optimal Intervention: Day {dag.optimal_intervention_day}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dag.summary}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⬡</div>
        </div>
      )}
    </div>
  );
}
