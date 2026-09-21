import { useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { calculateGravel, createCopyText, formatNumber, startingDepths } from './calculator'
import { track } from './analytics'
import './styles.css'

const initialForm = { length: '', width: '', depth: '', projectType: 'Driveway' }

function App() {
  const [form, setForm] = useState(initialForm)
  const [started, setStarted] = useState(false)
  const [copyStatus, setCopyStatus] = useState(null)
  const formRef = useRef(null)
  const result = useMemo(() => calculateGravel(form), [form.length, form.width, form.depth])
  const hasValues = form.length !== '' || form.width !== '' || form.depth !== ''
  const validResult = result.errors.length === 0 && hasValues

  const update = (field, value) => {
    if (!started) {
      setStarted(true)
      track('calculator_started')
    }
    setCopyStatus(null)
    setForm(current => ({ ...current, [field]: value }))
  }

  const onProjectType = (projectType) => {
    const suggestedDepth = startingDepths[projectType]
    update('projectType', projectType)
    if (suggestedDepth && !form.depth) {
      setForm(current => ({ ...current, projectType, depth: String(suggestedDepth) }))
    }
  }

  const onSubmit = event => {
    event.preventDefault()
    setStarted(true)
    if (validResult) track('calculator_completed', { projectType: form.projectType, calculator: 'gravel' })
  }

  const copy = async () => {
    if (!validResult) return
    const content = createCopyText({ ...form, result })
    try {
      await navigator.clipboard.writeText(content)
      setCopyStatus('success')
      track('copy_results')
    } catch {
      setCopyStatus('error')
    }
  }

  const reset = () => {
    setForm(initialForm)
    setStarted(false)
    setCopyStatus(null)
    track('reset_clicked')
    formRef.current?.querySelector('input')?.focus()
  }

  return (
    <>
      <main className="site-shell">
        <header className="hero">
          <div className="brand">
            <img
              className="brand-logo"
              src="/athena-calculators-logo.jpg"
              alt="ATHENA Calculators"
            />
          </div>
          <p className="eyebrow">GRAVEL CALCULATOR</p>
          <h1>How Much Gravel Do I Need?</h1>
          <p className="intro">
            This is a free gravel calculator for homeowners, contractors, and
            DIYers that estimates how much gravel to order from area dimensions
            and depth.
          </p>
        </header>

        <section className="calculator-card" aria-labelledby="calculator-title">
          <div className="calculator-heading">
            <h2 id="calculator-title">Get your gravel estimate</h2>
            <p>Enter the finished area and planned gravel depth.</p>
          </div>

          <form onSubmit={onSubmit} ref={formRef} noValidate>
            <div className="field-grid">
              <label>
                Length <span>(feet)</span>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="any"
                  value={form.length}
                  onChange={e => update('length', e.target.value)}
                  aria-invalid={Boolean(
                    result.errors.find(error => error.startsWith('Length'))
                  )}
                />
              </label>

              <label>
                Width <span>(feet)</span>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="any"
                  value={form.width}
                  onChange={e => update('width', e.target.value)}
                  aria-invalid={Boolean(
                    result.errors.find(error => error.startsWith('Width'))
                  )}
                />
              </label>

              <label>
                Depth <span>(inches)</span>
                <input
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="any"
                  value={form.depth}
                  onChange={e => update('depth', e.target.value)}
                  aria-invalid={Boolean(
                    result.errors.find(error => error.startsWith('Depth'))
                  )}
                />
              </label>

              <label>
                Project type <span>(optional)</span>
                <select
                  value={form.projectType}
                  onChange={e => onProjectType(e.target.value)}
                >
                  <option>Driveway</option>
                  <option>Walkway</option>
                  <option>Patio</option>
                  <option>Landscape Bed</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <p className="hint">
              Planning suggestions: driveway 4 in, walkway 3 in, patio 4 in,
              landscape bed 3 in. Site conditions and material may call for
              something different.
            </p>

            {started && result.errors.length > 0 && (
              <div className="errors" role="alert">
                {result.errors.map(error => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}

            <button className="primary-button" type="submit">
              Calculate gravel
            </button>
          </form>

          <section
            className="result"
            aria-live="polite"
            aria-label="Gravel calculation result"
          >
            {validResult ? (
              <>
                <p className="result-label">Calculated quantity:</p>

                <output className="yards">
                  {formatNumber(result.cubicYards)} <span>cubic yards</span>
                </output>

                <div className="order">
                  <span>Recommended order</span>
                  <strong>
                    {formatNumber(result.recommendedCubicYards)} cubic yards
                  </strong>
                  <small>
                    Includes a 10% planning allowance for waste, settling, and
                    measurement variation. It is not a universal engineering
                    requirement.
                  </small>
                </div>

                <p className="weight">
                  Estimated weight:{' '}
                  <strong>{formatNumber(result.estimatedTons)} tons</strong>
                </p>

                <div className="order">
                  <span>Recommended order</span>
                  <strong>{formatNumber(result.recommendedTons)} tons</strong>
                </div>

                <div className="actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={copy}
                  >
                    {copyStatus === 'success' ? 'Copied!' : 'Copy Results'}
                  </button>

                  <button
                    className="text-button"
                    type="button"
                    onClick={reset}
                  >
                    Reset
                  </button>
                </div>

                {copyStatus === 'success' && (
                  <p className="copy-status" role="status">
                    Results copied.
                  </p>
                )}

                {copyStatus === 'error' && (
                  <p className="copy-status copy-error" role="status">
                    Copy unavailable. Please try again.
                  </p>
                )}
              </>
            ) : (
              <p className="empty-result">
                Your estimate will appear here.
              </p>
            )}
          </section>

          <p className="assumption">
            Gravel density varies by material and supplier. This tool uses a
            planning estimate of 1.4 tons per cubic yard unless you use a
            supplier-provided density.
          </p>
        </section>

        <section className="affiliate-card" aria-label="Recommended gravel project supplies">
          <p className="affiliate-label">GRAVEL PROJECT SUPPLIES</p>
          <h2>Ready to order your project materials?</h2>
          <p>
            Use your gravel estimate to plan the job, then compare landscape
            gravel, fabric, and edging on Amazon.
          </p>
          <div className="affiliate-links">
            <a
              href="https://www.amazon.com/s?k=landscape+gravel+bags&tag=athena-gravel-20"
              target="_blank"
              rel="sponsored noopener"
              onClick={() => track('affiliate_click', { program: 'amazon_associates', calculator: 'gravel', placement: 'gravel_bags' })}
            >
              Shop bagged landscape gravel <span>(paid link)</span>
            </a>
            <a
              href="https://www.amazon.com/s?k=landscape+fabric+landscape+edging&tag=athena-gravel-20"
              target="_blank"
              rel="sponsored noopener"
              onClick={() => track('affiliate_click', { program: 'amazon_associates', calculator: 'gravel', placement: 'landscape_fabric_edging' })}
            >
              Shop landscape fabric &amp; edging <span>(paid link)</span>
            </a>
          </div>
        </section>

        <article className="content">
          <section>
            <h2>How the calculator works</h2>
            <p>
              Measure the length and width of the space in feet, then choose
              the depth of gravel you plan to install. The gravel calculator
              turns that volume into cubic yards, estimates weight in tons,
              and adds a modest ordering buffer.
            </p>

            <div className="method">
              <strong>Methodology</strong>
              <p>
                Cubic feet = length × width × (depth in inches ÷ 12)
                <br />
                Cubic yards = cubic feet ÷ 27
                <br />
                Estimated tons = cubic yards × 1.4
              </p>
            </div>
          </section>

          <section>
            <h2>How much gravel do I need?</h2>
            <p>
              Start with the dimensions of the area you want to cover. A
              rectangular driveway, walkway, patio base, or landscape bed is
              easy to estimate with length × width × depth. For curved areas,
              divide the shape into simple sections, calculate each, then add
              the results.
            </p>
          </section>

          <section>
            <h2>How deep should gravel be?</h2>
            <p>
              Depth depends on the job, the base below it, drainage, local
              conditions, and the gravel itself. About 3 inches can be a
              starting point for a walkway or landscape bed; a driveway often
              needs a deeper, properly prepared base. These are planning
              suggestions, not universal installation rules.
            </p>
          </section>

          <section>
            <h2>Cubic yards vs tons</h2>
            <p>
              Cubic yards measure volume. Tons measure weight. Suppliers may
              sell driveway gravel, pea gravel, or crushed stone by either
              measure. Because rock size, material type, and moisture affect
              density, one cubic yard does not always weigh the same amount.
            </p>
          </section>

          <section>
            <h2>Why your supplier's number may differ</h2>
            <p>
              Your supplier may use a different tons-per-yard conversion for
              their specific material. Ask for their product density and use
              their advice when placing the order. The calculator's 1.4 tons
              per cubic yard is a transparent planning estimate—not a material
              specification.
            </p>
          </section>

          <section>
            <h2>Gravel calculator for driveways, walkways, patios, and beds</h2>
            <p>
              Use the calculator for common rectangular project areas such as
              driveways, walkways, patios, and landscape beds. For irregular
              spaces, split the area into simple sections, calculate each
              section, and add the results together.
            </p>
          </section>

          <p><a href="/gravel-calculator-tons">Need help with tonnage? Read the gravel tons planning guide.</a></p>

          <section>
            <h2>Ordering gravel from a supplier</h2>
            <p>
              Cubic yards tell you the volume of material. Your supplier may
              convert that volume to tons using a density specific to the
              gravel or crushed stone you are buying. Confirm the supplier's
              density and final quantity before placing a bulk order.
            </p>
          </section>

          <section>
            <h2>FAQ</h2>

            <details>
              <summary>Should I order extra gravel?</summary>
              <p>
                This calculator adds a 10% planning allowance to help with
                normal variation. It is not a universal requirement; consider
                your site, access, and supplier guidance.
              </p>
            </details>

            <details>
              <summary>Can I use this as a driveway gravel calculator?</summary>
              <p>
                Yes. Enter the driveway dimensions and your planned depth. For
                vehicle areas, confirm base and depth requirements with a
                qualified local contractor or supplier.
              </p>
            </details>

            <details>
              <summary>Does this work for pea gravel?</summary>
              <p>
                Yes, as a volume planning tool. Check the supplier's density
                for a more material-specific ton estimate.
              </p>
            </details>
          </section>
        </article>
      </main>

      <nav aria-label="More ATHENA Calculators">
        <p><strong>More ATHENA Calculators:</strong> <a href="https://athena-public-platform.pages.dev/tools/">ATHENA Tools</a> · <a href="https://mulch-calculator-5xl.pages.dev/">Mulch Calculator</a> · <a href="https://concrete-calculator-cic.pages.dev/">Concrete Calculator</a> · <a href="https://flooring-calculator.pages.dev/">Flooring Calculator</a></p>
      </nav>

      <footer>
        <p>Free gravel calculator for practical planning.</p>
        <p>As an Amazon Associate I earn from qualifying purchases.</p>
        <a href="/privacy.html">Privacy Policy</a>
      </footer>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)